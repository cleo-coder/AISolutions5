// src/pages/FeedBack.jsx
import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const FeedBack = () => {
    const [userId, setUserId] = useState(null);
    const [email, setEmail] = useState(''); // Added state for email
    const [fullName, setFullName] = useState(''); // Added state for full name
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState('');

    const API_BASE_URL = 'http://localhost:3000/api';
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUserId(decodedToken.userId);
                setEmail(decodedToken.email || 'N/A'); // Populate email from token
                setFullName(decodedToken.full_name || 'N/A'); // Populate full_name from token
            } catch (e) {
                console.error("Failed to decode JWT:", e);
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSubmitMessage({ type: '', text: '' });

        if (!message || message.trim() === '' || rating === 0 || !userId || !selectedProductId) {
            setSubmitMessage({ type: 'error', text: 'Please select a product, provide a message, and rating.' });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ message, rating, productId: selectedProductId })
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitMessage({ type: 'success', text: data.message });
                setShowSuccessPopup(true);
                setMessage('');
                setRating(0);
                setHoverRating(0);
                setSelectedProductId('');
                setTimeout(() => {
                    setShowSuccessPopup(false);
                    navigate('/dashboard');
                }, 5000);
            } else {
                setSubmitMessage({ type: 'error', text: data.message || 'Failed to submit feedback.' });
            }
        } catch (error) {
            console.error('Feedback submission error:', error);
            setSubmitMessage({ type: 'error', text: 'Network error or server unavailable.' });
        } finally {
            setLoading(false);
        }
    };

    const handleReturnToDashboard = () => {
        setShowSuccessPopup(false);
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-6">
                    Provide Feedback
                </h2>
                {/* User Details Display */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        <span className="font-semibold">User ID:</span> {userId || 'N/A'}
                    </p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        <span className="font-semibold">Email:</span> {email || 'N/A'}
                    </p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        <span className="font-semibold">Full Name:</span> {fullName || 'N/A'}
                    </p>
                </div>

                {submitMessage.text && (
                    <div className={`p-3 mb-4 rounded-md text-sm ${
                        submitMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                        'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    }`}>
                        {submitMessage.text}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="product" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            Select Product
                        </label>
                        <select
                            id="product"
                            name="product"
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm"
                            required
                        >
                            <option value=""> Select a Product </option>
                            <option value="1">AI Assistant</option>
                            <option value="2">Prototyping</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="rating" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            Overall Rating
                        </label>
                        <div className="flex justify-center text-3xl">
                            {[...Array(5)].map((_, index) => {
                                const starValue = index + 1;
                                return (
                                    <FaStar
                                        key={starValue}
                                        className={`cursor-pointer transition-colors duration-200 ${
                                            (hoverRating || rating) >= starValue
                                                ? 'text-yellow-400'
                                                : 'text-gray-300 dark:text-gray-600'
                                        }`}
                                        onClick={() => setRating(starValue)}
                                        onMouseEnter={() => setHoverRating(starValue)}
                                        onMouseLeave={() => setHoverRating(0)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            Your Message
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            rows="4"
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white sm:text-sm"
                            placeholder="Tell us what you think..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                        ></textarea>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-yellow-400  dark:hover:bg-yellow-500 dark:text-gray-900 font-semibold transition"
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </div>
                </form>
            </div>

            {showSuccessPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl text-center relative max-w-sm w-full animate-fade-in-up">
                        <h3 className="text-xl font-bold mb-3">Feedback Submitted!</h3>
                        <p className="text-base mb-4">
                            Your feedback has been successfully recorded. Thank you for helping us improve!
                        </p>
                        <button
                            onClick={handleReturnToDashboard}
                            className="px-6 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 transition-colors duration-200"
                        >
                            Return to Dashboard
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

export default FeedBack;