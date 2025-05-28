// src/pages/Profile.jsx
// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

export default function Profile() {
    const [user, setUser] = useState({ user_id: '', full_name: '', username: '', email: '', company_name: '' });
    const [originalUser, setOriginalUser] = useState(null);

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_new_password: ''
    });

    const [message, setMessage] = useState(''); // This will be the message for general errors/warnings/info
    const [popupType, setPopupType] = useState(null); // 'success', 'error', 'warning', or 'info' for general messages
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false); // New state for success popup

    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.userId) {
                    setUser(prev => ({ ...prev, user_id: decoded.userId }));
                    fetchUserDetails(decoded.userId, token);
                } else {
                    setMessage('Token decoded, but no userId found. Please log in again.');
                    setPopupType('error');
                    setIsLoading(false);
                    // navigate('/login'); // Uncomment if you want to redirect
                }
            } catch (err) {
                setMessage('Failed to decode token. Please log in again.');
                setPopupType('error');
                setIsLoading(false);
                // navigate('/login'); // Uncomment if you want to redirect
            }
        } else {
            setMessage('No token found. Please log in.');
            setPopupType('error');
            setIsLoading(false);
            // navigate('/login'); // Uncomment if you want to redirect
        }
    }, []); // Empty dependency array means this runs once on mount

    // Effect for auto-dismissing general messages (errors, warnings, info)
    useEffect(() => {
        let timer;
        if (message && popupType !== 'success') { // Only auto-dismiss if not the dedicated success popup message
            timer = setTimeout(() => {
                setMessage('');
                setPopupType(null);
            }, 5000); // Popup will disappear after 5 seconds
        }
        return () => clearTimeout(timer); // Cleanup the timer
    }, [message, popupType]); // Rerun whenever the message or popupType state changes

    // Effect for auto-redirect after successful submission
    useEffect(() => {
        let timer;
        if (showSuccessPopup) {
            timer = setTimeout(() => {
                navigate('/dashboard'); // Redirect to dashboard
            }, 5000); // Redirect after 5 seconds
        }
        return () => clearTimeout(timer); // Cleanup timer on unmount or if popup is dismissed/hidden
    }, [showSuccessPopup, navigate]);


    const fetchUserDetails = async (userId, token) => {
        try {
            const res = await fetch('http://localhost:3000/api/auth/profile', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to load user details');

            const userData = {
                user_id: data.user_id,
                full_name: data.full_name || '',
                username: data.username || '',
                email: data.email || '',
                company_name: data.company_name || ''
            };
            setUser(userData);
            setOriginalUser(userData);
        } catch (err) {
            setMessage(`Error fetching user details: ${err.message}`);
            setPopupType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
        setIsEditing(true);
    };

    const handlePasswordChange = (e) => {
        setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
        setIsEditing(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous general message
        setPopupType(null); // Clear previous popup type
        setShowSuccessPopup(false); // Hide success popup on new submission attempt

        const token = localStorage.getItem('token');
        if (!token || !user.user_id) {
            setMessage('Authentication token missing. Please log in.');
            setPopupType('error');
            setIsEditing(false); // Reset editing state
            return;
        }

        let profileUpdateSuccess = true;
        let passwordUpdateSuccess = true;
        let finalMessages = [];

        const hasProfileChanged = originalUser && Object.keys(user).some(key =>
            key !== 'user_id' && user[key] !== originalUser[key]
        );

        if (hasProfileChanged) {
            try {
                const { user_id, ...profileDataToSend } = user; // Exclude user_id from payload
                const res = await fetch('http://localhost:3000/api/auth/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(profileDataToSend),
                });

                const data = await res.json(); // Read response even if not strictly needed
                if (!res.ok) {
                    profileUpdateSuccess = false;
                    finalMessages.push(`Profile update failed: ${data.message || 'Unknown error.'}`);
                } else {
                    finalMessages.push('Profile updated successfully.');
                    await fetchUserDetails(user.user_id, token); // Re-fetch to update originalUser after successful update
                }
            } catch (err) {
                profileUpdateSuccess = false;
                finalMessages.push(`Profile update failed: ${err.message}`);
            }
        } else {
            // Only add a message if nothing else is being updated and no password change attempt
            if (!passwordForm.current_password && !passwordForm.new_password && !passwordForm.confirm_new_password) {
                finalMessages.push('No general profile changes detected.');
            }
        }

        const isPasswordChangeAttempt = passwordForm.current_password || passwordForm.new_password || passwordForm.confirm_new_password;

        if (isPasswordChangeAttempt) {
            if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_new_password) {
                passwordUpdateSuccess = false;
                finalMessages.push('All password fields are required to change password.');
            } else if (passwordForm.new_password !== passwordForm.confirm_new_password) {
                passwordUpdateSuccess = false;
                finalMessages.push('New password and confirm new password do not match.');
            } else if (passwordForm.new_password.length < 6) {
                passwordUpdateSuccess = false;
                finalMessages.push('New password must be at least 6 characters long.');
            } else {
                try {
                    const res = await fetch(`http://localhost:3000/api/users/${user.user_id}/password`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            current_password: passwordForm.current_password,
                            new_password: passwordForm.new_password,
                        }),
                    });

                    const data = await res.json();
                    if (!res.ok) {
                        passwordUpdateSuccess = false;
                        finalMessages.push(`Password update failed: ${data.message || 'Unknown error.'}`);
                    } else {
                        finalMessages.push('Password updated successfully.');
                        setPasswordForm({ current_password: '', new_password: '', confirm_new_password: '' });
                    }
                } catch (err) {
                    passwordUpdateSuccess = false;
                    finalMessages.push(`Password update failed: ${err.message}`);
                }
            }
        }

        // Determine final message and popup type
        if (profileUpdateSuccess && passwordUpdateSuccess && (hasProfileChanged || isPasswordChangeAttempt)) {
            // Overall success for changes
            setShowSuccessPopup(true); // Show the dedicated success popup
            setMessage(''); // Clear general message
            setPopupType(null); // Clear general popup type
        } else if (!hasProfileChanged && !isPasswordChangeAttempt) {
            // No changes attempted
            setMessage('No changes to save.');
            setPopupType('info');
        }
        else {
            // Some error occurred or partial success
            setMessage(finalMessages.join(' '));
            setPopupType('error'); // Display combined error messages in the general popup
        }

        setIsEditing(false); // Reset editing state regardless of success/failure
    };

    const handleCancel = () => {
        setUser(originalUser);
        setPasswordForm({ current_password: '', new_password: '', confirm_new_password: '' });
        setMessage('');
        setPopupType(null); // Clear popup type on cancel
        setShowSuccessPopup(false); // Hide success popup on cancel
        setIsEditing(false);
    };

    const handleReturnToDashboard = () => {
        setShowSuccessPopup(false); // Hide the popup immediately
        navigate('/dashboard'); // Redirect to dashboard
    };

    if (isLoading) return <div className="text-center mt-20">Loading profile...</div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-light dark:bg-dark text-lightText dark:text-darkText p-6 relative"> {/* Added relative for popup positioning */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-md space-y-4">
                <h2 className="text-2xl font-bold text-center text-primary dark:text-accent">My Profile</h2>

                <input
                    name="full_name"
                    value={user.full_name}
                    onChange={handleChange}
                    className="w-full p-2 rounded text-black dark:bg-gray-700 dark:text-white"
                    placeholder="Full Name"
                    autoComplete="name"
                />

                <input
                    name="username"
                    value={user.username}
                    onChange={handleChange}
                    className="w-full p-2 rounded text-black dark:bg-gray-700 dark:text-white"
                    placeholder="Username"
                    autoComplete="username"
                />

                <input
                    name="email"
                    type="email"
                    value={user.email}
                    onChange={handleChange}
                    className="w-full p-2 rounded text-black dark:bg-gray-700 dark:text-white"
                    placeholder="Email"
                    autoComplete="email"
                />

                <input
                    name="company_name"
                    value={user.company_name}
                    onChange={handleChange}
                    className="w-full p-2 rounded text-black dark:bg-gray-700 dark:text-white"
                    placeholder="Company Name"
                    autoComplete="organization"
                />

                <hr className="border-t border-gray-300 dark:border-gray-600 my-4" />
                <h3 className="text-xl font-semibold text-center text-primary dark:text-accent">Change Password</h3>

                <input
                    type="password"
                    name="current_password"
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    className="w-full p-2 rounded text-black dark:bg-gray-700 dark:text-white"
                    placeholder="Current Password (required to change password)"
                    autoComplete="current-password"
                />

                <input
                    type="password"
                    name="new_password"
                    value={passwordForm.new_password}
                    onChange={handlePasswordChange}
                    className="w-full p-2 rounded text-black dark:bg-gray-700 dark:text-white"
                    placeholder="New Password"
                    autoComplete="new-password"
                />

                <input
                    type="password"
                    name="confirm_new_password"
                    value={passwordForm.confirm_new_password}
                    onChange={handlePasswordChange}
                    className="w-full p-2 rounded text-black dark:bg-gray-700 dark:text-white"
                    placeholder="Confirm New Password"
                    autoComplete="new-password"
                />

                <div className="flex justify-between items-center gap-4 mt-6">
                    {isEditing && (
                        <>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 bg-gray-500 dark:bg-gray-600 text-white py-2 rounded hover:opacity-80 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-primary dark:bg-accent text-white py-2 rounded hover:opacity-90 transition-colors duration-200"
                            >
                                Save Changes
                            </button>
                        </>
                    )}
                </div>
            </form>

            {/* General Popup for Errors/Warnings/Info */}
            {message && popupType && (
                <div className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${message ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className={`relative p-6 rounded-lg shadow-2xl max-w-sm w-full text-center transform transition-transform duration-300 scale-100
                        ${popupType === 'success' ? 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-800 dark:text-white dark:border-green-600' :
                            popupType === 'error' ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-800 dark:text-white dark:border-red-600' :
                                popupType === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-800 dark:text-black dark:border-yellow-600' :
                                    'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-800 dark:text-white dark:border-blue-600' // 'info' or default
                        }`}>

                        <h3 className="text-xl font-bold mb-3">
                            {popupType === 'success' ? 'Success!' :
                                popupType === 'error' ? 'Error!' :
                                    popupType === 'warning' ? 'Warning!' : 'Info'}
                        </h3>
                        <p className="text-base">
                            {message}
                        </p>

                        {/* Close button */}
                        <button
                            onClick={() => { setMessage(''); setPopupType(null); }} // Hide popup
                            className="absolute top-2 right-2 text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-gray-400 text-lg"
                            aria-label="Close message"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}

            {/* Dedicated Success Popup for Profile/Password Updates */}
            {showSuccessPopup && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black bg-opacity-50 transition-opacity duration-300 opacity-100">
                    <div className="relative p-8 rounded-lg shadow-2xl max-w-sm w-full text-center bg-green-100 text-green-800 border border-green-300 dark:bg-green-800 dark:text-white dark:border-green-600 transform transition-transform duration-300 scale-100">
                        <h3 className="text-xl font-bold mb-3">Changes Saved!</h3>
                        <p className="text-base mb-4">
                            Your profile and/or password have been updated successfully.
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
                        {/* Close button (optional, as it auto-redirects) */}
                        <button
                            onClick={() => setShowSuccessPopup(false)} // Just hide the popup, auto-redirect still works
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
}