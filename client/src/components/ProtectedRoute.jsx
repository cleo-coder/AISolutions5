import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const roleRoutes = {
    '/dashboard': ['user'],
    '/admin/dashboard': ['admin'],
    '/profile': ['user', 'admin'],
    '/admin/events': ['admin']
};

export default function ProtectedRoute({ children }) {
    const token = localStorage.getItem('token');
    const location = useLocation();
    let userRole = null;


    if (token) {
        try {
            const decoded = jwtDecode(token);
            userRole = decoded.role;
        } catch (error) {
            console.error("Invalid token:", error);

            localStorage.removeItem('token');
            localStorage.removeItem('role');
            return <Navigate to="/home" state={{ from: location }} replace />;
        }
    }


    if (!token) {

        return <Navigate to="/login" state={{ from: location }} replace />;
    }


    const allowedRoles = roleRoutes[location.pathname];


    if (allowedRoles && !allowedRoles.includes(userRole)) {

        if (userRole === 'user') {
            return <Navigate to="/dashboard" replace />;
        } else {

            return <Navigate to="/" replace />;
        }
    }


    return children;
}