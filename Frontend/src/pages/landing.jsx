import '../index.css';
import { Player } from '@lottiefiles/react-lottie-player';
import animationData from '../assets/Call.json';

export default function Landingpage() {
    return (
        <>
            <div className="absolute top-0 z-[-2] h-screen w-screen bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-[size:20px_20px]" />

            <div className='landingpageContainer min-h-screen text-white'>

                <nav className='flex justify-between items-center px-12 py-7'>
                    <div className='text-6xl font-bold max-w-lg text-blue-300'>Meetrix</div>
                    <ul className='flex gap-6 list-none items-center'>
                        <li className='cursor-pointer hover:text-blue-400 transition-colors'>JOIN as Guest</li>
                        <li className='cursor-pointer hover:text-blue-400 transition-colors'>Register</li>
                        <li className='bg-blue-900 hover:bg-blue-400 px-4 py-2 rounded-2xl cursor-pointer shadow-lg shadow-blue-500/60 transition-colors'>Login</li>
                    </ul>
                </nav>

                <div className='flex justify-between px-12 mt-24 items-center '>

                    {/* Left */}
                    <div>
                        <h1 className='text-5xl font-bold leading-tight'>
                        <span className='text-6xl'>Connect</span> with your&nbsp; 
                            <span className='bg-gradient-to-r from-[#b8d0ff] via-[#57107d] to-[#b8d0ff] bg-clip-text text-transparent'>
                                 Loved Ones
                            </span>
                        </h1>
                        <p className='text-[#b8d0ff] opacity-60 text-xl mt-4'>
                            Cover the distance by Meetrix Video Call
                        </p>
                        <button className='mt-6 w-fit px-8 py-3 rounded-3xl font-semibold bg-gradient-to-r from-[#001947] to-[#57107d] hover:from-[#57107d] hover:to-[#001947] border border-[#b8d0ff]/30 shadow-lg shadow-[#57107d]/40 transition-all'>
                            Get Started
                        </button>
                    </div>

                    {/* Right */}
                    <div><Player
                        autoplay
                        loop
                        src={animationData}
                        style={{ width: '400px', height: '400px' }}
                    /></div>

                </div>

            </div>
        </>
    );
}