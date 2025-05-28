import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';

import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import DemoRequest from './pages/DemoRequest';
import DemoSuccess from './pages/DemoSuccess';
import Events from './pages/Events';
import Products from './pages/Products';
import FeedBack from './pages/FeedBack';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="admin/dashboard" element={<Navigate to="/admin" replace />} />
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="demo-request" element={<DemoRequest />} />
                <Route path="demo-success" element={<DemoSuccess />} />
                <Route path="events" element={<Events />} />
                <Route path="products" element={<Products />} />
                <Route path="feedback" element={<FeedBack />} />
                <Route path="register" element={<Register />} />
                <Route path="login" element={<Login />} />
                <Route path="dashboard" element={<Dashboard />} />
            </Route>
        </Routes>


    );
}