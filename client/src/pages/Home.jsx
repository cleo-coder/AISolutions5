import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import orb from '../assets/orb-network.png';
import { FaMoon, FaSun } from 'react-icons/fa';

export default function Home() {
    const location = useLocation();
    const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

    useEffect(() => {
        const root = document.documentElement;
        if (darkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [darkMode]);

    return (
        <div className="min-h-screen w-full bg-gray-50 dark:bg-[#2C3531] text-gray-900 dark:text-[#D9B08C] flex flex-col overflow-hidden">
            <main className="flex-grow flex flex-col items-center justify-center relative px-6 text-center">
                <section className="z-10 space-y-6 max-w-3xl">
                    <h1 className="text-5xl md:text-6xl font-serif font-bold leading-tight text-gray-900 dark:text-gray-100">
                        Empower Your Business with AI-Powered Innovation
                    </h1>
                    <p className="text-lg md:text-xl max-w-xl mx-auto text-gray-700 dark:text-gray-300">
                        Streamline operations with virtual assistants and prototyping tools designed for scale-ups and visionary teams.
                    </p>
                    <Link
                        to="/register"
                        className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-full text-lg hover:bg-indigo-700 dark:bg-yellow-400 dark:text-black dark:hover:bg-yellow-500 transition"
                    >
                        Get Started Now
                    </Link>
                </section>



                {/* Orb in the background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <div className="relative w-[480px] h-[480px] rounded-full overflow-hidden">
                        <img
                            src={orb}
                            alt="Glowing Orb"
                            className="absolute inset-0 w-full h-full object-contain mix-blend-screen opacity-100 animate-spin-slow rounded-full"
                            style={{
                                filter: `
          drop-shadow(0 0 12px var(--orb-glow-color1))
          drop-shadow(0 0 20px var(--orb-glow-color2))
          drop-shadow(0 0 30px var(--orb-glow-color3))
          drop-shadow(0 0 40px var(--orb-glow-color4))
        `,
                            }}
                        />
                    </div>
                </div>




            </main>
        </div>
    );
}
