// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Link } from 'react-router-dom';
import Orb from '../components/Orb'; 

export default function Dashboard() {
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');
    const [demoSuccess, setDemoSuccess] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return setError('No token provided');

        try {
            const decoded = jwtDecode(token);

            // Fetch profile
            fetch(`/api/users/${decoded.userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => setProfile(data))
                .catch(() => setError('Failed to fetch profile'));

            // Fetch activity stats
            fetch(`/api/users/${decoded.userId}/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then((res) => res.json())
                .then((data) => setStats(data))
                .catch(() => setError('Failed to fetch stats'));
        } catch {
            setError('Invalid token');
        }
    }, []);

    
    const handleDemoSuccess = () => {
        setDemoSuccess(true);
        setTimeout(() => setDemoSuccess(false), 5000);
    };

    if (error)
        return <div className="text-center text-red-500 mt-10 font-semibold">{error}</div>;
    if (!profile || !stats)
        return <div className="text-center mt-10 font-semibold">Loading...</div>;

    return (
        <div className="relative min-h-screen bg-light dark:bg-dark text-lightText dark:text-darkText p-8 overflow-hidden">
            {/* Orb Background */}
            <Orb />

            <div className="relative max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded p-6 space-y-6 z-10">
                <h2 className="text-3xl font-serif font-bold text-primary dark:text-accent mb-6">
                    Welcome, {profile.full_name}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <p>
                            <strong>Username:</strong> {profile.username}
                        </p>
                        <p>
                            <strong>Email:</strong> {profile.email}
                        </p>
                        <p>
                            <strong>Company:</strong> {profile.company_name}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-xl font-semibold mt-2">Your Stats</h3>
                        <p>📝 Demo Requests: {stats.demo_requests}</p>
                        <p>📅 Event Registrations: {stats.event_registrations}</p>
                        <p>🧠 Product Requests: {stats.features_accessed}</p>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="mt-6 bg-gray-100 dark:bg-gray-700 p-4 rounded shadow space-y-2">
                    <h3 className="text-lg font-bold">Quick Links</h3>
                    <ul className="space-y-1">
                        <li>

                            <Link
                                to="/profile"
                                className="hover:underline text-primary dark:text-accent"
                            >
                                Profile
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/products"
                                className="hover:underline text-primary dark:text-accent"
                            >
                                Products
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/demo-request"
                                className="hover:underline text-primary dark:text-accent"
                            >
                                Request Demo
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/events"
                                className="hover:underline text-primary dark:text-accent"
                            >
                                Events
                            </Link>

                        </li>
                        <li>
                            <Link
                                to="/feedback"
                                className="hover:underline text-primary dark:text-accent"
                            >
                                Feedback
                            </Link>

                        </li>
                    </ul>
                </div>

                
            </div>

            

            
        </div>
    );
}
