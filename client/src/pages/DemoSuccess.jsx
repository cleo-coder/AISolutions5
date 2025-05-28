// src/pages/DemoSuccess.jsx
import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function DemoSuccess() {
    const location = useLocation();
    const isLoggedIn = location.state?.isLoggedIn || false;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-light dark:bg-dark text-lightText dark:text-darkText transition-colors duration-500">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-10 max-w-lg w-full text-center">
                <div className="text-green-600 dark:text-green-400 text-6xl mb-6">
                    ✅
                </div>
                <h1 className="text-4xl font-extrabold mb-4">
                    Demo Request Successful!
                </h1>
                <p className="mb-8 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                    {isLoggedIn
                        ? 'Thank you for submitting your demo request. Our team will reach out shortly to help you get started.'
                        : 'Thanks for your request! For a smoother experience next time, consider logging in or registering.'}
                </p>
                <Link
                    to={isLoggedIn ? "/dashboard" : "/login"}
                    className="inline-block bg-blue-600 hover:bg-blue-700 dark:bg-yellow-400 dark:hover:bg-yellow-500 text-white dark:text-gray-900 font-semibold py-3 px-8 rounded-lg shadow-md transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-yellow-300"
                >
                    {isLoggedIn ? 'Go to Dashboard' : 'Log in / Register'}
                </Link>
            </div>
        </div>
    );
}
