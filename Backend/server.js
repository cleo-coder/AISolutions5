require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const featureAccessRoutes = require('./routes/featureAccessRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const eventRoutes = require('./routes/eventRoutes');
const demoRoutes = require('./routes/demoRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const app = express();
// this is to trust Render's proxy headers
app.set('trust proxy', 1);
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';
const server = http.createServer(app);

// Helper function to validate allowed domains dynamically
const checkAllowedOrigin = (origin, callback) => {
    if (!origin) return callback(null, true);
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    if (origin === process.env.CLIENT_URL) return callback(null, true);
    
    //  Dynamically whitelist all Vercel domains (Previews + Production)
    if (/\.vercel\.app$/.test(origin)) return callback(null, true);

    callback(new Error('CORS: Not allowed by policy: ' + origin));
};

const io = new Server(server, {
    cors: {
        origin: checkAllowedOrigin, // Uses the updated validation rules
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    }
});

io.on('connection', (socket) => {
    console.log(`⚡️ User connected: ${socket.id}`);

    socket.on('authenticate', async (token) => {
        try {
            if (!token) {
                console.warn('Authentication failed: No token provided.');
                socket.disconnect(true);
                return;
            }
            const decoded = jwt.verify(token, SECRET_KEY);
            const userId = decoded.userId;

            socket.join(userId.toString());
            console.log(`User ${userId} authenticated and joined room ${userId.toString()} with socket ID: ${socket.id}`);

            const [notifications] = await db.query(
                'SELECT notification_id, message, read_status, created_at FROM notifications WHERE user_id = ? AND read_status = FALSE ORDER BY created_at DESC',
                [userId]
            );
            if (notifications.length > 0) {
                socket.emit('initialUnreadNotifications', notifications);
            }

        } catch (error) {
            console.error('Socket authentication failed:', error.message);
            socket.disconnect(true);
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.id}`);
    });
});

// Applies the updated validation rules to Express HTTP requests
app.use(cors({
    origin: checkAllowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

const apiLimiter = rateLimit({
    windowMs: 25 * 60 * 1000,
    max: 100,
});
app.use('/api/', apiLimiter);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feature-access', featureAccessRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes(io));
app.use('/api/feedback', feedbackRoutes);
// REVISED MASTER PATCH - REPAIRS SCHEMAS WITHOUT DISTURBING CORES
app.get('/api/secure-database-patch-xyz', async (req, res) => {
    try {
        const db = require('./config/db'); 

        // Query MySQL to see exactly what columns exist in your products table
        const [columns] = await db.query('DESCRIBE products;');
        
        // Format the structure into a readable list
        const tableStructure = columns.map(col => `Field: <strong>${col.Field}</strong> | Type: ${col.Type}`).join('<br>');

        res.status(200).send(`
            <h1>🔍 Products Table Structure</h1>
            <p>Here are the exact columns inside your production database:</p>
            <div style="background:#f4f4f4; padding:15px; font-family:monospace; border-left:5px solid #0070f3;">
                ${tableStructure}
            </div>
            <p>Drop a screenshot or tell me what fields show up, and we'll instantly match the seeder query to them!</p>
        `);
    } catch (err) {
        console.error(err);
        res.status(500).send("❌ Failed to read table structure: " + err.message);
    }
});
//experiment block end/patch masterplan end
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

app.get('/', (req, res) => {
    res.send('Welcome to the Product Management API!');
});

app.use((req, res) => {
    res.status(404).json({ message: 'API Endpoint Not Found' });
});

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({
        message: 'Something broke!',
        error: err.message || 'Unknown error',
    });
});

server.listen(port, () => {
    console.log(` Server running on port ${port}`);
    console.log(`WebSocket server running on port ${port}`);
});

module.exports = { app, server, io };