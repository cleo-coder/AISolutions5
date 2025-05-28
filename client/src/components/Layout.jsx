// src/components/Layout.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import logo from '../assets/logo.png';
import { FaMoon, FaSun } from 'react-icons/fa';
import { HiMenu, HiX } from 'react-icons/hi';
import { jwtDecode } from "jwt-decode";
import NotificationBell from './NotificationBell';
import ChatBot from './ChatBot'; // Make sure this import is correct

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
    const [userRole, setUserRole] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Ensure your JWT payload has a 'role' field
                setUserRole(decoded.role);
                setUserId(decoded.userId);
            } catch (error) {
                console.error("Token decoding failed:", error);
                localStorage.clear(); // Clear invalid token
                setUserRole(null);
                setUserId(null);
                navigate('/'); // Redirect to home or login on invalid token
            }
        } else {
            // No token present, so it's a guest user
            setUserRole(null);
            setUserId(null);
        }
    }, [location, navigate]); // Rerun when location or navigate changes (though navigate is stable)

    const handleLogout = () => {
        localStorage.clear();
        setUserRole(null);
        setUserId(null);
        navigate('/');
    };

    const navLinkClass = (path) =>
        `px-3 py-1 rounded-lg text-sm font-medium transition-colors ${location.pathname === path
            ? 'bg-indigo-600 text-white dark:bg-amber-400 dark:text-black'
            : 'text-slate-700 dark:text-zinc-200 hover:bg-indigo-100 dark:hover:bg-amber-600 dark:hover:text-black'
        }`;

    const closeMenu = () => setIsMenuOpen(false);

    // NEW: Determine if the chatbot should be displayed
    // It should NOT be displayed if userRole is 'admin'
    const shouldShowChatBot = userRole !== 'admin';


    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 flex flex-col">
            <header className="w-full flex justify-between items-center px-4 py-3 shadow dark:shadow-none relative z-20">
                <div className="flex items-center">
                    <img
                        src={logo}
                        alt="Logo"
                        className="h-[90px] w-auto object-contain drop-shadow"
                        draggable="false"
                    />
                </div>

                <div className="md:hidden flex items-center gap-2">
                    {userId && <NotificationBell userId={userId} userRole={userRole} />}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-200 dark:bg-amber-500"
                        aria-label="Toggle Dark Mode"
                    >
                        {darkMode ? <FaSun className="text-yellow-800" /> : <FaMoon className="text-indigo-900" />}
                    </button>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 text-slate-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md"
                        aria-label="Open menu"
                    >
                        {isMenuOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
                    </button>
                </div>

                <nav className="hidden md:flex items-center gap-2 text-sm">
                    {userRole === 'admin' ? (
                        <>
                            <Link to="/admin" className={navLinkClass('/admin')}>Admin</Link>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600"
                            >
                                Logout
                            </button>
                            {userId && <NotificationBell userId={userId} userRole={userRole} />}
                        </>
                    ) : userRole === 'user' ? (
                        <>
                            <Link to="/dashboard" className={navLinkClass('/dashboard')}>Dashboard</Link>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600"
                            >
                                Logout
                            </button>
                            {userId && <NotificationBell userId={userId} userRole={userRole} />}
                        </>
                    ) : (
                        <>
                            <Link to="/" className={navLinkClass('/')}>Home</Link>
                            <Link to="/products" className={navLinkClass('/products')}>Products</Link>
                            <Link to="/demo-request" className={navLinkClass('/demo-request')}>Demo</Link>
                            <Link to="/events" className={navLinkClass('/events')}>Events</Link>
                            <Link to="/register" className={navLinkClass('/register')}>Register</Link>
                            <Link to="/login" className={navLinkClass('/login')}>Login</Link>
                        </>
                    )}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-200 dark:bg-amber-500 ml-2"
                        aria-label="Toggle Dark Mode"
                    >
                        {darkMode ? <FaSun className="text-yellow-800" /> : <FaMoon className="text-indigo-900" />}
                    </button>
                </nav>

                {isMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
                        onClick={closeMenu}
                    >
                        <nav className="absolute top-0 right-0 w-64 h-full bg-slate-50 dark:bg-zinc-800 shadow-lg p-6 flex flex-col gap-4 text-lg transform transition-transform duration-300 ease-in-out z-20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={closeMenu}
                                className="self-end p-2 text-slate-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md"
                                aria-label="Close menu"
                            >
                                <HiX className="h-6 w-6" />
                            </button>

                            {/* Notifications for mobile menu (added back here) */}
                            {userId && (
                                <div className="py-2">
                                    <NotificationBell userId={userId} userRole={userRole} />
                                </div>
                            )}

                            {userRole === 'admin' ? (
                                <>
                                    <Link to="/admin" className={navLinkClass('/admin')} onClick={closeMenu}>Admin</Link>
                                    <button
                                        onClick={() => { handleLogout(); closeMenu(); }}
                                        className="px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : userRole === 'user' ? (
                                <>
                                    <Link to="/dashboard" className={navLinkClass('/dashboard')} onClick={closeMenu}>Dashboard</Link>
                                    <Link to="/feedback" className={navLinkClass('/feedback')} onClick={closeMenu}>Feedback</Link>{/* Feedback link for regular users (mobile) */}
                                    <button
                                        onClick={() => { handleLogout(); closeMenu(); }}
                                        className="px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/" className={navLinkClass('/')} onClick={closeMenu}>Home</Link>
                                    <Link to="/products" className={navLinkClass('/products')} onClick={closeMenu}>Products</Link>
                                    <Link to="/demo-request" className={navLinkClass('/demo-request')} onClick={closeMenu}>Demo</Link>
                                    <Link to="/events" className={navLinkClass('/events')} onClick={closeMenu}>Events</Link>
                                    <Link to="/register" className={navLinkClass('/register')} onClick={closeMenu}>Register</Link>
                                    <Link to="/login" className={navLinkClass('/login')} onClick={closeMenu}>Login</Link>
                                </>
                            )}
                        </nav>
                    </div>
                )}
            </header>

            <main className="flex-grow px-4 pt-2 pb-0">
                <Outlet />
            </main>

            {/* Conditionally render the ChatBot component */}
            {shouldShowChatBot && <ChatBot darkMode={darkMode} userRole={userRole} />}
        </div>
    );
}