const express = require('express');
const router = express.Router();
// Remove the direct jwt import here as verifyToken will handle it
// const jwt = require('jsonwebtoken'); 
const db = require('../config/db'); // Ensure this path is correct for your db connection
// Import verifyToken and checkRole from authMiddleware
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Removed the custom authenticateToken middleware from here
// as we will use verifyToken and checkRole('user') from authMiddleware

// Route: User requests access to a product
router.post('/request-access', verifyToken, checkRole('user'), async (req, res) => { // Using consistent middleware
    console.log('/request-access: Route hit.');
    console.log('/request-access: Request body:', req.body);
    // req.user is now populated by verifyToken from authMiddleware
    console.log('/request-access: Authenticated user object:', req.user);

    const userId = req.user?.userId;

    if (!req.body.product_name) {
        console.warn('/request-access: Product name missing in request body.');
        return res.status(400).json({ message: 'Product name is required' });
    }

    if (!userId) {
        // This case should ideally be caught by verifyToken/checkRole('user')
        console.error('/request-access: User ID not found after authentication. This is an authentication middleware issue.');
        return res.status(500).json({ message: 'Authentication error: User ID not available.' });
    }

    const { product_name } = req.body;

    try {
        console.log(`/request-access: Searching for product_id for name: ${product_name}`);
        const [productRows] = await db.query(
            'SELECT product_id FROM products WHERE name = ?',
            [product_name]
        );

        if (productRows.length === 0) {
            console.error(`Product '${product_name}' not found in 'products' table. Ensure products table exists and contains this product.`);
            return res.status(404).json({ message: 'Product not found.' });
        }
        const productId = productRows[0].product_id;
        console.log(`Found product_id: ${productId} for product: ${product_name}`);

        console.log(`/request-access: Checking for existing request for userId: ${userId}, product_id: ${productId}`);
        const [existingRequestRows] = await db.query(
            'SELECT status FROM product_access WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (existingRequestRows.length > 0) {
            console.log(`/request-access: Existing request found, status: ${existingRequestRows[0].status}`);
            return res.json({ status: existingRequestRows[0].status });
        }

        console.log(`/request-access: Inserting new request for userId: ${userId}, product_id: ${productId}, name: ${product_name}`);
        await db.query(
            'INSERT INTO product_access (user_id, product_id, name, status) VALUES (?, ?, ?, ?)',
            [userId, productId, product_name, 'requested']
        );

        console.log('/request-access: Request successfully inserted. Status: requested');
        return res.json({ status: 'requested' });
    } catch (error) {
        console.error('Error in /request-access (inside try-catch block):', error.message);
        console.error('Stack trace:', error.stack);
        return res.status(500).json({ message: 'Server error processing request.' });
    }
});

// Route: Get product access status for the logged-in user
router.get('/product-access-status', verifyToken, checkRole('user'), async (req, res) => { // Using consistent middleware
    console.log('/product-access-status: Route hit.');
    const userId = req.user?.userId;

    if (!userId) {
        console.error('/product-access-status: User ID not found after authentication.');
        return res.status(500).json({ message: 'Authentication error: User ID not available.' });
    }

    try {
        console.log(`/product-access-status: Fetching status for user ID: ${userId}`);
        const [rows] = await db.query(
            'SELECT pa.status, p.name AS product_name FROM product_access pa JOIN products p ON pa.product_id = p.product_id WHERE pa.user_id = ?',
            [userId]
        );
        console.log('/product-access-status: Data fetched:', rows);
        return res.json(rows);
    } catch (error) {
        console.error('Error in /product-access-status (inside try-catch block):', error.message);
        console.error('Stack trace:', error.stack);
        return res.status(500).json({ message: 'Server error fetching access status' });
    }
});

module.exports = router;