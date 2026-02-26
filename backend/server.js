// server.js - Main backend server file
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const storyRoutes = require('./routes/storyRoutes');
const apiRoutes = require('./routes/apiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const reactionRoutes = require('./routes/reactionRoutes');
const groupRoutes = require('./routes/groupRoutes');
const qaRoutes = require('./routes/qaRoutes');

// Import Security Middleware
const {
    xssClean,
    preventHpp,
    authLimiter,
    securityLogger
} = require('./middleware/securityMiddleware');

// Import database connection
const { pool: db } = require('./config/database');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// 1. Security Logger (First)
app.use(securityLogger);

// 2. Helmet - Security Headers (Tightened)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "http://localhost:5000"],
            frameSrc: ["'self'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'same-origin' },
}));

// CORS configuration (Already defined)
const corsOptions = {
    origin: [process.env.CORS_ORIGIN || 'http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 3. Data Sanitization & Protection
app.use(express.json({ limit: '1mb' })); // Reduced limit for better security
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(xssClean); // Sanitizes against XSS
app.use(preventHpp); // Prevents HTTP Parameter Pollution
app.use(mongoSanitize()); // Kept as extra layer, though using MySQL

// 4. Rate Limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api/', generalLimiter);

// 5. Secure Static Files (Block sensitive files)
app.use((req, res, next) => {
    const sensitiveFilePatterns = [
        /\.env/, /\.git/, /\.sql/, /\.md$/,
        /package(-lock)?\.json/, /backend\//,
        /\.bak/, /\.swp/
    ];
    if (sensitiveFilePatterns.some(pattern => pattern.test(req.url))) {
        console.warn(`[SECURITY CHECK] Blocked access to sensitive path: ${req.url} from ${req.ip}`);
        return res.status(403).json({ success: false, error: 'Access denied' });
    }
    next();
});

// Serve frontend files from root
app.use(express.static(path.join(__dirname, '../')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Compression
app.use(compression());

// 6. DB Connection & Initialization
db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
    console.log(' Database connected successfully');
    connection.release();
    createTables();
});

// 7. API Routes (v1 Versioning)
const API_V1 = '/api/v1';

// Specifically limit auth routes
app.use(`${API_V1}/auth`, authLimiter, authRoutes);

app.use(`${API_V1}/bookings`, bookingRoutes);
app.use(`${API_V1}/stories`, storyRoutes);
app.use(`${API_V1}/admin`, adminRoutes);
app.use(`${API_V1}/volunteers`, volunteerRoutes);
app.use(`${API_V1}/reactions`, reactionRoutes);
app.use(`${API_V1}/groups`, groupRoutes);
app.use(`${API_V1}/qa`, qaRoutes);
app.use(`${API_V1}`, apiRoutes);

// Keep legacy routes for backward compatibility (optional, but good if transition is slow)
// We'll redir them or just keep them for now
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/stories', storyRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.1.0 (Hardened)',
        api_version: 'v1'
    });
});


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: {
            code: statusCode,
            message: message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 404,
            message: 'Endpoint not found'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Health check: http://localhost:${PORT}/health`);
});

// Function to create database tables
function createTables() {
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY AUTO_INCREMENT,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255),
            phone VARCHAR(20),
            role ENUM('user', 'counselor', 'admin') DEFAULT 'user',
            status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
            recovery_days INT DEFAULT 0,
            last_login DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    const createBookingsTable = `
        CREATE TABLE IF NOT EXISTS bookings (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            counselor_id INT,
            booking_date DATE NOT NULL,
            booking_time TIME NOT NULL,
            session_type ENUM('peer-support', 'grief-counseling', 'recovery-checkin', 'mental-health', 'general') NOT NULL,
            status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no-show') DEFAULT 'pending',
            notes TEXT,
            meeting_link VARCHAR(500),
            rating INT CHECK (rating >= 1 AND rating <= 5),
            feedback TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (counselor_id) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_user_id (user_id),
            INDEX idx_counselor_id (counselor_id),
            INDEX idx_status (status),
            INDEX idx_date (booking_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    const createStoriesTable = `
        CREATE TABLE IF NOT EXISTS stories (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT,
            title VARCHAR(255),
            content TEXT NOT NULL,
            category ENUM('grief', 'recovery', 'mental-health', 'hope', 'general') NOT NULL,
            is_anonymous BOOLEAN DEFAULT TRUE,
            allow_comments BOOLEAN DEFAULT TRUE,
            likes INT DEFAULT 0,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_category (category),
            INDEX idx_status (status),
            INDEX idx_created (created_at),
            FULLTEXT idx_search (title, content)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    const createProgressTable = `
        CREATE TABLE IF NOT EXISTS progress (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            date DATE NOT NULL,
            mood ENUM('terrible', 'bad', 'okay', 'good', 'great'),
            recovery_day BOOLEAN DEFAULT FALSE,
            journal_entry TEXT,
            self_care_score INT CHECK (self_care_score >= 0 AND self_care_score <= 100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_date (user_id, date),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_date (user_id, date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    const createEmergencyContactsTable = `
        CREATE TABLE IF NOT EXISTS emergency_contacts (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            relationship VARCHAR(100),
            phone VARCHAR(20) NOT NULL,
            user_id INT NOT NULL,
            is_primary BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    const createResourcesTable = `
        CREATE TABLE IF NOT EXISTS resources (
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            category ENUM('coping', 'education', 'emergency', 'self-care', 'community') NOT NULL,
            file_url VARCHAR(500),
            external_link VARCHAR(500),
            is_free BOOLEAN DEFAULT TRUE,
            downloads INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_category (category)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    const createStoryCommentsTable = `
        CREATE TABLE IF NOT EXISTS story_comments (
            id INT PRIMARY KEY AUTO_INCREMENT,
            story_id INT NOT NULL,
            user_id INT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_story (story_id),
            INDEX idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    const queries = [
        createUsersTable,
        createBookingsTable,
        createStoriesTable,
        createProgressTable,
        createEmergencyContactsTable,
        createResourcesTable,
        createStoryCommentsTable
    ];

    db.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting database connection:', err);
            return;
        }

        queries.forEach((query, index) => {
            connection.query(query, (error, results) => {
                if (error) {
                    console.error(`Error creating table ${index + 1}:`, error);
                } else {
                    console.log(` Table ${index + 1} created/verified successfully`);
                }
            });
        });

        connection.release();
    });
}