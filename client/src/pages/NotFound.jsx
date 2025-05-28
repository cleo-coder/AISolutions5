// src/pages/NotFound.jsx
import React from 'react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center text-center">
            <div>
                <h1 className="text-5xl font-bold text-primary mb-4">404</h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">Oops! Page not found.</p>
                <a
                    href="/"
                    className="px-4 py-2 bg-primary dark:bg-accent text-white rounded hover:opacity-90"
                >
                    Go Back Home
                </a>
            </div>
        </div>
    );
}
