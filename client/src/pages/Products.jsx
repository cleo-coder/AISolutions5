import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

import AIAssistantImage from '../assets/ai assistant.jpg';
import PrototypingImage from '../assets/prototyping.jpg';

export default function Products() {
    const [user, setUser] = useState(null);
    const [productAccessStatus, setProductAccessStatus] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const navigate = useNavigate();
    const location = useLocation();

    const productsData = [
        {
            name: 'AI Assistant',
            description: 'Automate tasks and enhance productivity with our smart assistant.',
            image: AIAssistantImage,
        },
        {
            name: 'Prototyping',
            description: 'Build and test ideas quickly with our prototyping toolkit.',
            image: PrototypingImage,
        },
    ];

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp < Date.now() / 1000) {
                    localStorage.clear();
                    return;
                }
                setUser({
                    id: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                });
            } catch {
                localStorage.clear();
            }
        }
    }, []);

    useEffect(() => {
        if (user?.id) fetchProductAccessStatus();
    }, [user]);

    const fetchProductAccessStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/feature-access/product-access-status', {
                headers: { Authorization: `Bearer ${token}` },
            });

            let data;
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await res.json();
            } else {
                const errorText = await res.text();
                throw new Error(errorText || 'Failed to fetch access status: Non-JSON response.');
            }

            if (!res.ok) throw new Error(data.message || 'Failed to fetch access status');

            const statusMap = data.reduce((acc, item) => {
                acc[item.product_name] = item.status;
                return acc;
            }, {});
            setProductAccessStatus(statusMap);
        } catch (error) {
            setModalMessage('Error fetching product access status.');
            setShowModal(true);
        }
    };

    const handleAccessRequest = async (productName) => {
        if (!user) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/feature-access/request-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ product_name: productName }),
            });

            let data;
            const contentType = res.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                data = await res.json();
            } else {
                const errorText = await res.text();
                throw new Error(errorText || 'Server responded with a non-JSON error.');
            }

            if (!res.ok) {
                throw new Error(data.message || 'Request failed');
            }

            let userMessage = '';
            switch (data.status) {
                case 'granted':
                    userMessage = `You already have access to "${productName}".`;
                    break;
                case 'requested':
                    userMessage = `Your request has been sent to our tech team!`;
                    break;
                case 'pending':
                    userMessage = `You already asked for access! Our team will respond soon.`;
                    break;
                case 'denied':
                    userMessage = `Access to "${productName}" was denied. Please contact support.`;
                    break;
                case 'revoked': // Added for completeness if backend can return this directly
                    userMessage = `Your access to "${productName}" has been revoked.`;
                    break;
                default:
                    userMessage = data.message || 'Something happened.';
            }

            setModalMessage(userMessage);
            setShowModal(true);

            setProductAccessStatus((prev) => ({
                ...prev,
                [productName]: data.status === 'requested' ? 'pending' : data.status,
            }));
        } catch (err) {
            setModalMessage(err.message || 'An unexpected error occurred.');
            setShowModal(true);
        }
    };

    const getButtonLabel = (productName) => {
        const status = productAccessStatus[productName];
        switch (status) {
            case 'granted':
                return 'Approved'; // Changed from 'Access Granted'
            case 'pending':
                return 'Pending';
            case 'denied':
                return 'Rejected'; // Changed from 'Access Denied'
            case 'revoked': // Added new case
                return 'Revoked';
            default:
                return 'Get Access';
        }
    };

    const isButtonDisabled = (productName) => {
        const status = productAccessStatus[productName];
        // Button should be disabled if access is granted, pending, denied, or revoked
        return ['granted', 'pending', 'denied', 'revoked'].includes(status);
    };

    return (
        <div className="min-h-screen p-6 bg-light dark:bg-dark text-lightText dark:text-darkText">
            <h1 className="text-3xl md:text-4xl font-bold mb-10 text-center tracking-tight">
                Our Products
            </h1>

            <div className="grid gap-8 md:grid-cols-2">
                {productsData.map(({ name, description, image }) => (
                    <div
                        key={name}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden flex flex-col items-center text-center p-6 space-y-4 transition-transform duration-300 hover:scale-[1.015]"
                    >
                        <img
                            src={image}
                            alt={name}
                            className="h-48 w-full object-cover rounded-lg shadow-sm"
                        />
                        <h2 className="text-2xl font-semibold text-indigo-700 dark:text-yellow-400">{name}</h2>
                        <p className="text-gray-700 dark:text-gray-300">{description}</p>
                        <button
                            onClick={() => handleAccessRequest(name)}
                            disabled={isButtonDisabled(name)}
                            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow ${isButtonDisabled(name)
                                ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-yellow-400 dark:text-black dark:hover:bg-yellow-500'
                                }`}
                        >
                            {getButtonLabel(name)}
                        </button>
                        {isButtonDisabled(name) && (
                            <small className="text-xs text-gray-500 dark:text-gray-400">
                                Status: {productAccessStatus[name]}
                            </small>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full text-center shadow-xl">
                        <p className="text-lg text-gray-800 dark:text-gray-100 mb-4">{modalMessage}</p>
                        <button
                            onClick={() => setShowModal(false)}
                            className="mt-2 px-4 py-2 rounded-md bg-indigo-600 dark:bg-yellow-400 text-white dark:text-black hover:bg-indigo-700 dark:hover:bg-yellow-500 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}