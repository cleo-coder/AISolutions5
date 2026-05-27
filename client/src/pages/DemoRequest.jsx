// src/pages/DemoRequest.jsx
import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const DemoRequest = () => {
    const [companyName, setCompanyName] = useState('');
    const [requestMessage, setRequestMessage] = useState('');
    const [preferredDate, setPreferredDate] = useState('');
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayMinDate = getTodayDate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userId = decoded.userId || decoded.id || decoded._id;
                setIsLoggedIn(true);
                fetch(`/api/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data) {
                            if (data.company_name) {
                                setCompanyName(data.company_name);
                            }
                            if (data.email) {
                                setEmail(data.email);
                            }
                        }
                    })
                    .catch(err => console.error('❌ Failed to fetch user info:', err));
            } catch (err) {
                console.error('❌ Token decode error:', err);
            }
        }
    }, []);

    // Effect for auto-redirect after successful submission
    useEffect(() => {
        let timer;
        if (showSuccessPopup) {
            timer = setTimeout(() => {
                // Redirect based on login status
                if (isLoggedIn) {
                    navigate('/dashboard');
                } else {
                    navigate('/'); // Redirect guest users to home
                }
            }, 5000); // Redirect after 5 seconds
        }
        return () => clearTimeout(timer);
    }, [showSuccessPopup, isLoggedIn, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setShowSuccessPopup(false);

        if (!companyName || !requestMessage || !preferredDate || (!email && !isLoggedIn)) {
            setError('All fields are required.');
            return;
        }

        const selectedDate = new Date(preferredDate);
        const today = new Date(todayMinDate);
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            setError('Preferred date cannot be in the past.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
            };

            const payload = { company_name: companyName, request_message: requestMessage, preferred_date: preferredDate, email: email };

            const response = await fetch('/api/demo/submit', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Internal Server Error');
            }

            setShowSuccessPopup(true);
            setCompanyName(isLoggedIn ? companyName : '');
            setRequestMessage('');
            setPreferredDate('');
            setEmail(isLoggedIn ? email : '');

        } catch (err) {
            console.error('❌ Demo request error:', err);
            setError(err.message || 'Something went wrong');
            setShowSuccessPopup(false);
        }
    };

    const handleReturnToDashboard = () => {
        setShowSuccessPopup(false);
        // Redirect based on login status
        if (isLoggedIn) {
            navigate('/dashboard');
        } else {
            navigate('/'); // Redirect guest users to home
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-light dark:bg-dark text-lightText dark:text-darkText transition-colors duration-500 relative">
            <div className="max-w-xl mx-auto p-6 rounded-lg shadow-lg bg-white dark:bg-gray-900">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Request a Demo</h2>

                {error && <div className="text-red-500 mb-4">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Company Name
                        </label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            disabled={isLoggedIn}
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            disabled={isLoggedIn}
                            required
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Preferred Date
                        </label>
                        <input
                            type="date"
                            value={preferredDate}
                            onChange={(e) => setPreferredDate(e.target.value)}
                            min={todayMinDate}
                            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            required
                        />
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Request Message
                        </label>
                        <textarea
                            value={requestMessage}
                            onChange={(e) => setRequestMessage(e.target.value)}
                            rows={5}
                            className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-yellow-400 dark:hover:bg-yellow-500 text-white py-2 rounded-md transition-colors dark:text-gray-900 font-semibold transition"
                    >
                        Submit Request
                    </button>
                </form>
            </div>

            {/* Success Popup for Demo Request */}
            {showSuccessPopup && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black bg-opacity-50 transition-opacity duration-300 opacity-100">
                    <div className="relative p-8 rounded-lg shadow-2xl max-w-sm w-full text-center bg-green-100 text-green-800 border border-green-300 dark:bg-green-800 dark:text-white dark:border-green-600 transform transition-transform duration-300 scale-100">
                        <h3 className="text-xl font-bold mb-3">Demo Request Submitted!</h3>
                        <p className="text-base mb-4">
                            Your demo request has been successfully submitted. We will contact you shortly!
                        </p>
                        <button
                            onClick={handleReturnToDashboard}
                            className="px-6 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 transition-colors duration-200"
                        >
                            Return to {isLoggedIn ? 'Dashboard' : 'Home'}
                        </button>
                        <p className="text-xs mt-2 text-gray-600 dark:text-gray-300">
                            (Redirecting in 5 seconds...)
                        </p>
                        <button
                            onClick={() => setShowSuccessPopup(false)}
                            className="absolute top-2 right-2 text-green-700 dark:text-green-200 hover:text-green-900 dark:hover:text-green-400 text-lg"
                            aria-label="Close message"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DemoRequest;