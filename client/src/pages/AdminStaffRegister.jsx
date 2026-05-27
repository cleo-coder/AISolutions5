// src/pages/AdminStaffRegister.jsx
import React, { useState } from 'react';

export default function AdminStaffRegister() {
    const [form, setForm] = useState({
        username: '',
        full_name: '',
        email: '',
        password: '',
        
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        // Basic validation
        if (!form.username || !form.full_name || !form.email || !form.password) {
            setMessage('All fields are required.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, // Must be admin to register staff
                },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Registration failed');

            setMessage('✅ Staff registered successfully!');
            setForm({ username: '', full_name: '', email: '', password: '' });
        } catch (err) {
            setMessage(`❌ ${err.message}`);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-primary dark:text-accent">
                Register New Admin
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                    className="w-full p-2 rounded text-black"
                    required
                />
                <input
                    name="full_name"
                    placeholder="Fullname"
                    value={form.full_name}
                    onChange={handleChange}
                    className="w-full p-2 rounded text-black"
                    required
                />

                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full p-2 rounded text-black"
                    required
                />
                <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full p-2 rounded text-black"
                    required
                />
               
                <button
                    type="submit"
                    className="w-full bg-primary dark:bg-accent text-white py-2 rounded hover:opacity-90"
                >
                    Register
                </button>
                {message && (
                    <p
                        className={`text-center mt-2 ${message.startsWith('✅') ? 'text-green-500' : 'text-red-500'
                            }`}
                    >
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
}
