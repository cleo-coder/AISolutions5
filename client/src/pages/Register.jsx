import { useState } from 'react';

export default function Register() {
    const [form, setForm] = useState({ full_name: '', company_name: '', username: '', email: '', password: '' });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!form.full_name || !form.company_name || !form.username || !form.email || !form.password) {
            setMessage('All fields are required');
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Registration failed');

            setMessage('✅ Registered successfully! Redirecting...');
            setTimeout(() => window.location.href = '/login', 1500);
        } catch (err) {
            setMessage(`❌ ${err.message}`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-light dark:bg-dark text-lightText dark:text-darkText transition-colors duration-500">
            <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full space-y-6"
            >
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 text-center">
                    Register
                </h2>

                <input
                    type="text"
                    name="full_name"
                    placeholder="Full Name"
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-yellow-400 transition"
                />

                <input
                    type="text"
                    name="company_name"
                    placeholder="Company Name"
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-yellow-400 transition"
                />

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-yellow-400 transition"
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-yellow-400 transition"
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-yellow-400 transition"
                />

                <button
                    type="submit"
                    className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-yellow-400 dark:hover:bg-yellow-500 text-white dark:text-gray-900 font-semibold transition"
                >
                    Register
                </button>

                {message && (
                    <p className={`text-center text-sm mt-2 ${message.startsWith('✅') ? 'text-green-500' : 'text-red-500'}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
}
