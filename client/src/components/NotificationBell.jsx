// NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaCheckCircle, FaTrash } from 'react-icons/fa';
import io from 'socket.io-client';

const NotificationBell = ({ userRole, userId }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const socketRef = useRef(null);

    const API_BASE_URL = '/api';
    const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
    

    const fetchNotifications = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read_status).length);
            } else {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await res.json();
                    console.error('Failed to fetch notifications (JSON error):', errorData.message || res.statusText);
                } else {
                    const errorText = await res.text();
                    console.error('Failed to fetch notifications (Non-JSON error):', errorText);
                }
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const markAsRead = async (id) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await res.json();
                    console.error('Failed to mark as read (JSON error):', errorData.message || res.statusText);
                } else {
                    const errorText = await res.text();
                    console.error('Failed to mark as read (Non-JSON error):', errorText);
                }
            }
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/notifications/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await res.json();
                    console.error('Failed to delete notification (JSON error):', errorData.message || res.statusText);
                    alert(`Error deleting notification: ${errorData.message || res.statusText}`);
                } else {
                    const errorText = await res.text();
                    console.error('Failed to delete notification (Non-JSON error):', errorText);
                    alert(`Error deleting notification: ${errorText}`);
                }
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
            alert('An unexpected error occurred while deleting the notification.');
        }
    };

    useEffect(() => {
        fetchNotifications();

        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No token found, WebSocket connection not established.');
            return;
        }

        socketRef.current = io(SOCKET_URL, {
            auth: {
                token: token
            }
        });

        socketRef.current.on('connect', () => {
            console.log('⚡️ Connected to WebSocket server');
        });

        socketRef.current.on('initialUnreadNotifications', (initialNotifications) => {
            console.log('Received initial unread notifications via WS:', initialNotifications);
            fetchNotifications();
        });

        socketRef.current.on('newNotification', (newNotification) => {
            console.log('✉️ Received new notification via WebSocket:', newNotification);
            setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
            setUnreadCount(prevCount => prevCount + 1);
        });

        socketRef.current.on('notificationRead', ({ notificationId }) => {
            console.log(`✅ Notification ${notificationId} marked as read via WebSocket update.`);
            setNotifications(prevNotifications =>
                prevNotifications.map(n =>
                    n.notification_id === notificationId ? { ...n, read_status: true } : n
                )
            );
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        });

        socketRef.current.on('notificationDeleted', ({ notificationId }) => {
            console.log(`🗑️ Notification ${notificationId} deleted via WebSocket update.`);
            setNotifications(prevNotifications => {
                const updatedNotifications = prevNotifications.filter(n => n.notification_id !== notificationId);
                setUnreadCount(updatedNotifications.filter(n => !n.read_status).length);
                return updatedNotifications;
            });
        });

        socketRef.current.on('disconnect', () => {
            console.log('🔌 Disconnected from WebSocket server');
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                console.log('WebSocket disconnected on component unmount.');
            }
        };
    }, [userId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
                <FaBell className="text-xl text-gray-700 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 overflow-hidden ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                        <div className="block px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">Notifications</div>
                        {notifications.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">No new notifications.</p>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.notification_id}
                                    className={`flex items-center px-4 py-3 border-b last:border-b-0 border-gray-200 dark:border-gray-700 ${notification.read_status ? 'bg-gray-50 dark:bg-gray-700' : 'bg-blue-50 dark:bg-blue-900'}`}
                                >
                                    <div className="flex-grow text-sm">
                                        <p className={`${notification.read_status ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                                            {notification.message}
                                        </p>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(notification.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center">
                                        {!notification.read_status && (
                                            <button
                                                onClick={() => markAsRead(notification.notification_id)}
                                                className="ml-2 p-1 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-800 transition duration-150 ease-in-out"
                                                title="Mark as Read"
                                            >
                                                <FaCheckCircle />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(notification.notification_id)}
                                            className="ml-2 p-1 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-800 transition duration-150 ease-in-out"
                                            title="Delete Notification"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;