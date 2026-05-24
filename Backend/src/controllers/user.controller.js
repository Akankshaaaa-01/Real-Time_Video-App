import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    user.token = token;
    await user.save();

    return res.status(httpStatus.OK).json({ token, username: user.username, name: user.name });
  } catch (err) {
    return res.status(500).json({ message: `Something went wrong: ${err}` });
  }
};

const register = async (req, res) => {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, username, password: hashedPassword });
    await newUser.save();

    return res
      .status(httpStatus.CREATED)
      .json({ message: "User registered successfully" });
  } catch (err) {
    return res.status(500).json({ message: `Something went wrong: ${err}` });
  }
};

const addToActivity = async (req, res) => {
  const { token, meeting_code } = req.body;
  if (!token || !meeting_code) {
    return res.status(400).json({ message: "Token and meeting code are required" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Deduplicate atomically using findOneAndUpdate with upsert
    const tenSecondsAgo = new Date(Date.now() - 10000);
    await Meeting.findOneAndUpdate(
      {
        user_id: decoded.userId,
        meetingCode: meeting_code,
        date: { $gte: tenSecondsAgo }
      },
      {
        $setOnInsert: {
          user_id: decoded.userId,
          meetingCode: meeting_code,
          date: new Date()
        }
      },
      {
        upsert: true,
        new: true
      }
    );

    return res.status(200).json({ message: "Added to activity successfully" });
  } catch (err) {
    return res.status(500).json({ message: `Something went wrong: ${err.message}` });
  }
};

const getAllActivity = async (req, res) => {
  const token = req.query.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const activities = await Meeting.find({ user_id: decoded.userId }).sort({ createdAt: -1 });
    return res.status(200).json(activities);
  } catch (err) {
    return res.status(500).json({ message: `Something went wrong: ${err.message}` });
  }
};

export { login, register, addToActivity, getAllActivity };
