// src/pages/Events.jsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

export default function Events() {
    const [events, setEvents] = useState([]);
    const [category, setCategory] = useState('All');
    const [userInfo, setUserInfo] = useState({ userId: null, email: '' });

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [guestEmail, setGuestEmail] = useState('');
    const [currentEventIdForRegistration, setCurrentEventIdForRegistration] = useState(null);

    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusModalMessage, setStatusModalMessage] = useState('');
    const [isSuccessStatus, setIsSuccessStatus] = useState(false);
    const [redirectToPath, setRedirectToPath] = useState(null);
    const [countdown, setCountdown] = useState(5);

    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:3000/api/events')
            .then(res => res.json())
            .then(data => setEvents(data))
            .catch(() => showStatusMessage('Failed to load events', false));
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserInfo({ userId: decoded.userId, email: decoded.email });
            } catch (err) {
                console.warn('Invalid token');
            }
        }
    }, []);

    useEffect(() => {
        let timer;
        let countdownInterval;

        if (showStatusModal && isSuccessStatus && redirectToPath) {
            setCountdown(5);
            countdownInterval = setInterval(() => {
                setCountdown(prev => {
                    if (prev === 1) {
                        clearInterval(countdownInterval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            timer = setTimeout(() => {
                navigate(redirectToPath);
            }, 5000);
        }

        return () => {
            clearTimeout(timer);
            clearInterval(countdownInterval);
        };
    }, [showStatusModal, isSuccessStatus, redirectToPath, navigate]);

    const showStatusMessage = (message, isSuccess, redirectPath = null) => {
        setStatusModalMessage(message);
        setIsSuccessStatus(isSuccess);
        setRedirectToPath(isSuccess ? redirectPath : null);
        setShowStatusModal(true);
        if (isSuccess && redirectPath) {
            setCountdown(5);
        }
    };

    const closeStatusModal = () => {
        setShowStatusModal(false);
        setStatusModalMessage('');
        setIsSuccessStatus(false);
        setRedirectToPath(null);
        setCountdown(5);
    };

    const handleModalButtonClick = () => {
        closeStatusModal();
        if (redirectToPath) {
            navigate(redirectToPath);
        }
    };

    const processRegistration = async (eventId, emailToUse, userIdToUse) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3000/api/events/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({
                    event_id: eventId,
                    email: emailToUse,
                    user_id: userIdToUse
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            const path = userIdToUse ? '/dashboard' : '/';
            showStatusMessage('✅ Successfully registered!', true, path);

        } catch (err) {
            showStatusMessage(`❌ ${err.message}`, false);
        }
    };

    const handleRegister = async (eventId) => {
        const token = localStorage.getItem('token');

        if (!token) {
            setCurrentEventIdForRegistration(eventId);
            setGuestEmail('');
            setShowEmailModal(true);
        } else {
            await processRegistration(eventId, userInfo.email, userInfo.userId);
        }
    };

    const handleGuestRegistrationSubmit = async () => {
        if (!guestEmail || !guestEmail.includes('@')) {
            showStatusMessage('❌ A valid email is required.', false);
            return;
        }

        setShowEmailModal(false);
        await processRegistration(currentEventIdForRegistration, guestEmail, null);
        setCurrentEventIdForRegistration(null);
        setGuestEmail('');
    };

    const handleCloseEmailModal = () => {
        setShowEmailModal(false);
        setGuestEmail('');
        setCurrentEventIdForRegistration(null);
    };

    const filteredEvents = category === 'All' ? events : events.filter(e => e.category === category);

    return (
        <div className="min-h-screen p-6 bg-light dark:bg-dark text-lightText dark:text-darkText">
            <h1 className="text-3xl font-bold text-center mb-6">Upcoming Events</h1>

            <div className="flex justify-center space-x-4 mb-6">
                {['All', 'AI Assistant', 'Prototyping'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-4 py-2 rounded ${category === cat ? 'bg-primary text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-yellow-500 dark:text-indigo-900' : 'bg-gray-300 dark:bg-gray-700 text-black dark:text-indigo-200'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {filteredEvents.length === 0 ? (
                <p className="text-center">No events available.</p>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {filteredEvents.map(event => (
                        <div key={event.event_id} className="bg-white dark:bg-indigo-900 p-4 rounded shadow-md">
                            <h2 className="text-xl font-semibold text-primary dark:text-yellow-400">{event.title}</h2>
                            <p className="text-sm text-gray-500">{format(new Date(event.event_date), 'PPP')}</p>
                            <p className="mt-2">{event.description}</p>
                            <button
                                onClick={() => handleRegister(event.event_id)}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover: bg-indigo-700 opacity-90 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-indigo-900"
                            >
                                Register
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Custom Email Registration Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-sm transform transition-all duration-300 scale-100 opacity-100">
                        <h3 className="text-xl font-semibold text-primary dark:text-yellow-400 mb-4 text-center">Register for Event</h3>
                        <p className="text-center text-gray-700 dark:text-gray-300 mb-4">
                            Please enter your email to register for this event.
                        </p>
                        <input
                            type="email"
                            placeholder="Your email address"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md mb-4 text-black dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:focus:ring-yellow-400"
                            required
                        />
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCloseEmailModal}
                                className="px-4 py-2 rounded-md bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-indigo-200 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGuestRegistrationSubmit}
                                className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-indigo-900"
                            >
                                Register
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW: Status Message Modal - Enhanced for Success and Redirection */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`relative rounded-lg shadow-xl p-6 w-full max-w-sm transform transition-all duration-300 scale-100 opacity-100
                        ${isSuccessStatus ? 'bg-green-100 dark:bg-yellow-900 border border-green-500 text-green-800 dark:border-yellow-500 dark:text-yellow-200' : 'bg-red-100 dark:bg-red-900 border border-red-500 text-red-800 dark:text-red-200'}`}>
                        <button
                            onClick={closeStatusModal}
                            className="absolute top-3 right-3 text-gray-500 dark:text-indigo-300 hover:text-gray-700 dark:hover:text-indigo-100 text-xl"
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <p className="text-center font-medium mb-4">
                            {statusModalMessage}
                        </p>
                        {isSuccessStatus && redirectToPath && (
                            <div className="text-center mt-4">
                                <button
                                    onClick={handleModalButtonClick}
                                    className={`px-6 py-2 rounded-md text-white
                                        ${isSuccessStatus ? 'bg-green-600 hover:bg-green-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-indigo-900' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
                                >
                                    Return to {redirectToPath === '/dashboard' ? 'Dashboard' : 'Home'}
                                </button>
                                <p className="text-xs mt-2 text-gray-600 dark:text-gray-300">
                                    (Redirecting in {countdown} seconds...)
                                </p>
                            </div>
                        )}
                        {!isSuccessStatus && (
                            <div className="flex justify-center">
                                <button
                                    onClick={closeStatusModal}
                                    className={`px-4 py-2 rounded-md text-white
                                        ${isSuccessStatus ? 'bg-green-600 hover:bg-green-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-indigo-900' : 'bg-red-600 hover:bg-red-700 dark:text-indigo-100'} transition-colors`}
                                >
                                    OK
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}