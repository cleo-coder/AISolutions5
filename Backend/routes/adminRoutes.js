const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { Parser } = require('json2csv'); // For CSV export
const rateLimit = require = require('express-rate-limit'); // Import rate-limit

// Rate limiting middleware
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 60 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply middleware for all routes in this router
router.use(verifyToken);
router.use(checkRole('admin'));
router.use(apiLimiter); // Apply rate limiting to all admin routes

// Helper function to send CSV response
const sendCsvResponse = (res, data, filename, fields = null) => {
    try {
        const json2csvParser = new Parser({ fields }); // Pass fields to Parser constructor
        const csv = json2csvParser.parse(data);
        res.header('Content-Type', 'text/csv');
        res.attachment(filename);
        res.send(csv);
    } catch (err) {
        console.error('Error generating CSV:', err);
        res.status(500).json({ message: 'Server error generating CSV' });
    }
};

// GET all admins
router.get('/admins', async (req, res) => {
    try {
        const [admins] = await db.query("SELECT admin_id, username, email, full_name, created_at FROM admins");
        res.json(admins);
    } catch (err) {
        console.error('Error fetching admins:', err);
        res.status(500).json({ message: 'Server error fetching admins' });
    }
});

// GET admin by ID
router.get('/admins/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [admin] = await db.query("SELECT admin_id, username, email, full_name, created_at FROM admins WHERE admin_id = ?", [id]);
        if (admin.length === 0) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        res.json(admin[0]);
    } catch (err) {
        console.error('Error fetching admin details:', err);
        res.status(500).json({ message: 'Server error fetching admin details' });
    }
});

// POST register a new admin
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query("INSERT INTO admins (username, email, password, full_name, created_at) VALUES (?, ?, ?, ?, NOW())", [username, email, hashedPassword, full_name]);
        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (err) {
        console.error('Error registering admin:', err);
        res.status(500).json({ message: 'Server error registering admin' });
    }
});

// GET all users
router.get('/users', async (req, res) => {
    try {
        const [users] = await db.query("SELECT user_id, username, email, full_name, company_name, created_at FROM users");
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error fetching users' });
    }
});

// GET all demo requests
router.get('/demo-requests', async (req, res) => {
    try {
        const { status, export: exportCsv } = req.query;
        let query = "SELECT request_id, user_id, company_name, request_message, preferred_date, created_at, admin_response, email, status, admin_notes FROM demo_requests WHERE 1=1";
        const params = [];

        if (status) {
            query += " AND status = ?";
            params.push(status);
        }
        const [demos] = await db.query(query, params);

        if (exportCsv === 'csv') {
            const fields = ['request_id', 'user_id', 'company_name', 'request_message', 'preferred_date', 'created_at', 'admin_response', 'email', 'status', 'admin_notes'];
            return sendCsvResponse(res, demos, 'demo_requests.csv', fields);
        }

        res.json(demos);
    } catch (err) {
        console.error('Error fetching demo requests:', err);
        res.status(500).json({ message: 'Server error fetching demo requests' });
    }
});

// PUT update demo request status
router.put('/demo-requests/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes } = req.body;
        await db.query("UPDATE demo_requests SET status = ?, admin_notes = ? WHERE request_id = ?", [status, admin_notes, id]);
        res.status(200).json({ message: 'Demo request status updated successfully' });
    } catch (err) {
        console.error('Error updating demo request status:', err);
        res.status(500).json({ message: 'Server error updating demo request status' });
    }
});

// GET all events
router.get('/events', async (req, res) => {
    try {
        const [events] = await db.query("SELECT event_id, title, description, event_date, location, created_at, category FROM events");
        res.json(events);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ message: 'Server error fetching events' });
    }
});

// POST create a new event
router.post('/events', async (req, res) => {
    try {
        const { title, description, event_date, location, category } = req.body;
        await db.query("INSERT INTO events (title, description, event_date, location, category, created_at) VALUES (?, ?, ?, ?, ?, NOW())", [title, description, event_date, location, category]);
        res.status(201).json({ message: 'Event created successfully' });
    }
    catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ message: 'Server error creating event' });
    }
});

// PUT update an event
router.put('/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, event_date, location, category } = req.body;
        await db.query("UPDATE events SET title = ?, description = ?, event_date = ?, location = ?, category = ? WHERE event_id = ?", [title, description, event_date, location, category, id]);
        res.status(200).json({ message: 'Event updated successfully' });
    } catch (err) {
        console.error('Error updating event:', err);
        res.status(500).json({ message: 'Server error updating event' });
    }
});

// DELETE an event
router.delete('/events/:id', async (req, res) => {
    try {
        await db.query("DELETE FROM events WHERE event_id = ?", [req.params.id]);
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error('Error deleting event:', err);
        // Provide a more general message if ON DELETE CASCADE isn't working as expected
        res.status(409).json({ message: 'Cannot delete event: It is referenced by other records. Please ensure ON DELETE CASCADE is configured for all foreign keys referencing this event, or manually delete associated records first.' });
    }
});

// GET product access records (feature-access)
router.get('/feature-access', async (req, res) => {
    try {
        const [accessRecords] = await db.query(`
            SELECT
                pa.access_id,
                pa.user_id,
                u.username,
                u.email,
                u.company_name AS user_company_name,
                pa.product_id,
                p.name AS product_name,
                pa.granted_at,
                pa.granted_by,
                pa.status,
                pa.revoked_at,
                pa.revoked_by,
                -- pa.requested_at, -- Removed as per user request
                COALESCE(pa.cost, 0) AS cost,
                COALESCE(pa.cost, 0) AS cost,
                COALESCE(f.rating, 0) AS rating, -- Get numerical rating from feedback table
                pa.assigned_to,
                pa.job_title,
                pa.admin_notes
            FROM
                product_access pa
            JOIN
                users u ON pa.user_id = u.user_id
            JOIN
                products p ON pa.product_id = p.product_id
            LEFT JOIN -- Use LEFT JOIN since not all product_access entries might have feedback
                feedback f ON pa.feedback_id = f.feedback_id
        `);
        res.json(accessRecords);
    } catch (err) {
        console.error('Error fetching product access records:', err);
        res.status(500).json({ message: 'Server error fetching product access records' });
    }
});

// POST grant product access
router.post('/feature-access/grant', async (req, res) => {
    try {
        const { userId, productName } = req.body;
        const [[product]] = await db.query("SELECT product_id FROM products WHERE name = ?", [productName]);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const [[existingAccess]] = await db.query("SELECT access_id FROM product_access WHERE user_id = ? AND product_id = ?", [userId, product.product_id]);

        if (existingAccess) {
            await db.query("UPDATE product_access SET status = 'granted', granted_at = NOW(), granted_by = ?, revoked_at = NULL, revoked_by = NULL WHERE user_id = ? AND product_id = ?", [req.user.userId, userId, product.product_id]);
        } else {
            await db.query("INSERT INTO product_access (user_id, product_id, status, granted_at, granted_by, requested_at) VALUES (?, ?, 'granted', NOW(), ?, NOW())", [userId, product.product_id, req.user.userId]);
        }

        res.status(200).json({ message: 'Access granted successfully' });
    } catch (err) {
        console.error('Error granting access:', err);
        res.status(500).json({ message: 'Server error granting access' });
    }
});

// POST deny product access
router.post('/feature-access/deny', async (req, res) => {
    try {
        const { userId, productName } = req.body;
        const [[product]] = await db.query("SELECT product_id FROM products WHERE name = ?", [productName]);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        await db.query("UPDATE product_access SET status = 'denied' WHERE user_id = ? AND product_id = ?", [userId, product.product_id]);
        res.status(200).json({ message: 'Access denied successfully' });
    } catch (err) {
        console.error('Error denying access:', err);
        res.status(500).json({ message: 'Server error denying access' });
    }
});

// POST revoke product access
router.post('/feature-access/revoke', async (req, res) => {
    try {
        const { userId, productName } = req.body;
        const [[product]] = await db.query("SELECT product_id FROM products WHERE name = ?", [productName]);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        await db.query("UPDATE product_access SET status = 'revoked', revoked_at = NOW(), revoked_by = ? WHERE user_id = ? AND product_id = ?", [req.user.userId, userId, product.product_id]);
        res.status(200).json({ message: 'Access revoked successfully' });
    } catch (err) {
        console.error('Error revoking access:', err);
        res.status(500).json({ message: 'Server error revoking access' });
    }
});

// GET jobs (now considers any product_access with a product name as a 'job')
router.get('/jobs', async (req, res) => {
    try {
        const { solutionType, startDate, endDate, customer, page = 1, limit = 10, export: exportCsv } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let jobQueryParams = [];
        let jobFilterSolutionType = '';
        let jobFilterStartDate = '';
        let jobFilterEndDate = '';
        let jobFilterCustomer = '';

        if (solutionType) {
            jobFilterSolutionType = ' AND p.name = ?';
            jobQueryParams.push(solutionType);
        }
        if (startDate) {
            jobFilterStartDate = ' AND pa.granted_at >= ?';
            jobQueryParams.push(startDate);
        }
        if (endDate) {
            jobFilterEndDate = ' AND pa.granted_at <= ?';
            jobQueryParams.push(endDate);
        }
        if (customer) {
            jobFilterCustomer = ' AND u.full_name LIKE ?';
            jobQueryParams.push(`%${customer}%`);
        }

        let jobsQuery = `
            SELECT
                pa.access_id AS job_id,
                u.full_name AS customer_name,
                u.email AS customer_email,
                p.name AS solution_type,
                pa.status,
                COALESCE(pa.cost, 0) AS cost,
                COALESCE(pa.cost, 0) AS cost,
                COALESCE(f.rating, 0) AS satisfaction_rating, -- Get numerical rating from feedback table
                pa.granted_at AS job_date,
                pa.job_title, -- Keep job_title for display, but not for defining a 'job'
                pa.assigned_to,
                pa.admin_notes
            FROM
                product_access pa
            JOIN
                users u ON pa.user_id = u.user_id
            JOIN
                products p ON pa.product_id = p.product_id
            LEFT JOIN -- Use LEFT JOIN since not all product_access entries might have feedback
                feedback f ON pa.feedback_id = f.feedback_id
            WHERE
                p.name IS NOT NULL ${jobFilterSolutionType} ${jobFilterStartDate} ${jobFilterEndDate} ${jobFilterCustomer}
        `;

        if (exportCsv === 'csv') {
            const [jobsExport] = await db.query(jobsQuery + ' ORDER BY pa.granted_at DESC', jobQueryParams);
            // Updated fields for CSV export to match the new table structure
            const fields = ['job_id', 'customer_name', 'customer_email', 'solution_type', 'status', 'cost', 'cost', 'satisfaction_rating', 'job_date', 'admin_notes'];
            return sendCsvResponse(res, jobsExport, 'jobs_data.csv', fields);
        }

        const [jobs] = await db.query(jobsQuery + ' ORDER BY pa.granted_at DESC LIMIT ? OFFSET ?', [...jobQueryParams, parseInt(limit), offset]);

        const [[{ totalJobsCount }]] = await db.query(`
            SELECT COUNT(*) AS totalJobsCount
            FROM
                product_access pa
            JOIN
                users u ON pa.user_id = u.user_id
            JOIN
                products p ON pa.product_id = p.product_id
            LEFT JOIN
                feedback f ON pa.feedback_id = f.feedback_id
            WHERE
                p.name IS NOT NULL ${jobFilterSolutionType} ${jobFilterStartDate} ${jobFilterEndDate} ${jobFilterCustomer}
        `, jobQueryParams);

        res.json({
            jobs,
            totalJobs: totalJobsCount,
            totalPages: Math.ceil(totalJobsCount / limit),
            currentPage: parseInt(page)
        });
    } catch (err) {
        console.error('Error fetching jobs data:', err);
        res.status(500).json({ message: 'Server error fetching jobs data' });
    }
});


// GET overall metrics and job metrics
router.get('/metrics', async (req, res) => {
    try {
        const [[totalUsersResult]] = await db.query("SELECT COUNT(*) AS count FROM users");
        const [[totalDemoRequestsResult]] = await db.query("SELECT COUNT(*) AS count FROM demo_requests");
        const [[totalEventsResult]] = await db.query("SELECT COUNT(*) AS count FROM events");

        // Total jobs (now defined as any product_access linked to a product)
        const [[totalJobsResult]] = await db.query(`
            SELECT COUNT(*) AS count
            FROM product_access pa
            JOIN products p ON pa.product_id = p.product_id
            WHERE p.name IS NOT NULL
        `);

        // Total revenue and total cost from product_access for overall profit calculation
        const [[totalRevenueAllProductsResult]] = await db.query("SELECT SUM(COALESCE(cost, 0)) AS totalRevenue FROM product_access");
        const [[totalCostAllProductsResult]] = await db.query("SELECT SUM(COALESCE(trade_expenses, 0)) AS totalCost FROM product_access");

        // Job metrics (now defined as any product_access linked to a product)
        const [[jobMetricsResult]] = await db.query(`
            SELECT
                COUNT(pa.access_id) AS totalJobs,
                SUM(COALESCE(pa.cost, 0)) AS totalJobRevenue,
                AVG(COALESCE(f.rating, 0)) AS avgJobSatisfaction -- Get numerical rating from feedback table
            FROM
                product_access pa
            JOIN
                products p ON pa.product_id = p.product_id
            LEFT JOIN
                feedback f ON pa.feedback_id = f.feedback_id
            WHERE p.name IS NOT NULL
        `);

        res.json({
            totalUsers: totalUsersResult.count,
            totalDemoRequests: totalDemoRequestsResult.count,
            totalEvents: totalEventsResult.count,
            totalProductsAccessed: totalJobsResult.count, // This is now correctly "Total Jobs"
            totalProfitAllProducts: (totalRevenueAllProductsResult.totalRevenue || 0) - (totalCostAllProductsResult.totalCost || 0),
            jobMetrics: { // Specific metrics for "jobs"
                totalJobs: jobMetricsResult.totalJobs || 0,
                totalJobRevenue: jobMetricsResult.totalJobRevenue || 0,
                avgJobSatisfaction: jobMetricsResult.avgJobSatisfaction || 0,
            }
        });
    } catch (err) {
        console.error('Error fetching metrics:', err);
        res.status(500).json({ message: 'Server error fetching metrics' });
    }
});

// GET revenue by solution report
router.get('/reports/revenue-by-solution', async (req, res) => {
    try {
        const { startDate, endDate, export: exportCsv } = req.query;

        let dateFilter = '';
        const params = [];
        if (startDate && endDate) {
            dateFilter = `AND pa.granted_at BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        } else if (startDate) {
            dateFilter = `AND pa.granted_at >= ?`;
            params.push(startDate);
        } else if (endDate) {
            dateFilter = `AND pa.granted_at <= ?`;
            params.push(endDate);
        }

        const [revenueData] = await db.query(`
            SELECT
                p.name AS solution_type,
                SUM(COALESCE(pa.cost, 0)) AS total_revenue
            FROM
                product_access pa
            JOIN
                products p ON pa.product_id = p.product_id
            WHERE
                pa.cost IS NOT NULL
                ${dateFilter}
            GROUP BY
                p.name
            ORDER BY
                total_revenue DESC
        `, params);

        if (exportCsv === 'csv') {
            const fields = ['solution_type', 'total_revenue'];
            return sendCsvResponse(res, revenueData, 'revenue_report.csv', fields);
        }

        res.json(revenueData);
    } catch (err) {
        console.error('Error fetching revenue report:', err);
        res.status(500).json({ message: 'Server error fetching revenue report' });
    }
});

// GET profit margin by solution report
router.get('/reports/profit-margin-by-solution', async (req, res) => {
    try {
        const { startDate, endDate, export: exportCsv } = req.query;

        let dateFilter = '';
        const params = [];
        if (startDate && endDate) {
            dateFilter = `AND pa.granted_at BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        } else if (startDate) {
            dateFilter = `AND pa.granted_at >= ?`;
            params.push(startDate);
        } else if (endDate) {
            dateFilter = `AND pa.granted_at <= ?`;
            params.push(endDate);
        }

        const [profitMarginData] = await db.query(`
           SELECT
             p.name AS solution_type,
             SUM(COALESCE(pa.cost, 0)) AS total_revenue,
           SUM(COALESCE(pa.trade_expenses, 0)) AS total_cost,
             CASE
        WHEN SUM(COALESCE(pa.cost, 0)) = 0 THEN 0
        ELSE (SUM(COALESCE(pa.cost, 0)) - SUM(COALESCE(pa.trade_expenses, 0))) / SUM(COALESCE(pa.cost, 0))
        END AS average_profit_margin
           FROM
               product_access pa
           JOIN
               products p ON pa.product_id = p.product_id
           WHERE
               pa.cost IS NOT NULL AND pa.trade_expenses IS NOT NULL
               ${dateFilter}
           GROUP BY
               p.name
           ORDER BY
               average_profit_margin DESC
        `, params);

        if (exportCsv === 'csv') {
            const fields = ['solution_type', 'total_revenue', 'total_cost', 'average_profit_margin'];
            return sendCsvResponse(res, profitMarginData, 'profit_margin_report.csv', fields);
        }

        res.json(profitMarginData);
    } catch (err) {
        console.error('Error fetching profit margin report:', err);
        res.status(500).json({ message: 'Server error fetching profit margin report' });
    }
});

// GET CSAT by solution report
router.get('/reports/csat-by-solution', async (req, res) => {
    try {
        const { startDate, endDate, export: exportCsv } = req.query;
        console.log('1. CSAT API endpoint hit.');

        let dateFilter = '';
        const params = [];
        if (startDate && endDate) {
            dateFilter = `AND pa.granted_at BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        } else if (startDate) {
            dateFilter = `AND pa.granted_at >= ?`;
            params.push(startDate);
        } else if (endDate) {
            dateFilter = `AND pa.granted_at <= ?`;
            params.push(endDate);
        }

        // joining with feedback table for average rating
        console.log('2. Executing CSAT query...');
        const [csatData] = await db.query(`
            SELECT
                p.name AS solution_type,
                AVG(COALESCE(f.rating, 0)) AS average_csat_rating -- Get numerical rating from feedback table
            FROM
                product_access pa
            JOIN
                products p ON pa.product_id = p.product_id
            LEFT JOIN -- Use LEFT JOIN since not all product_access entries might have feedback
                feedback f ON pa.feedback_id = f.feedback_id
            WHERE
                pa.feedback_id IS NOT NULL -- Only consider entries with feedback
                ${dateFilter}
            GROUP BY
                p.name
            ORDER BY
                average_csat_rating DESC
        `, params);
        console.log('3. Query executed. Data received:', csatData);
        if (exportCsv === 'csv') {
            const fields = ['solution_type', 'average_csat_rating'];
            return sendCsvResponse(res, csatData, 'csat_report.csv', fields);
        }

        res.json(csatData);
    } catch (err) {
        console.error('Error fetching CSAT report:', err);
        res.status(500).json({ message: 'Server error fetching CSAT report' });
    }
});

// GET audit logs
router.get('/logs', async (req, res) => {
    try {
        const { type, date, export: exportCsv } = req.query;
        let query = `
            SELECT
                l.log_id,
                l.admin_id,
                a.username,
                l.action,
                l.target_table,
                l.description,
                l.timestamp
            FROM
                logs l
            LEFT JOIN
                admins a ON l.admin_id = a.admin_id
            WHERE 1=1
        `;
        const params = [];

        if (type) {
            query += ' AND l.action LIKE ?';
            params.push(`%${type}%`);
        }
        if (date) {
            query += ' AND DATE(l.timestamp) = ?';
            params.push(date);
        }
        query += ' ORDER BY l.timestamp DESC';

        const [logs] = await db.query(query, params);

        if (exportCsv === 'csv') {
            const fields = ['log_id', 'admin_id', 'username', 'action', 'target_table', 'description', 'timestamp'];
            return sendCsvResponse(res, logs, 'system_logs.csv', fields);
        }

        res.json(logs);
    } catch (err) {
        console.error('Error fetching logs:', err);
        res.status(500).json({ message: 'Server error fetching logs' });
    }
});


module.exports = router;