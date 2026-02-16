"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
// Load environment variables
dotenv_1.default.config();
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const leads_1 = __importDefault(require("./routes/leads"));
const properties_1 = __importDefault(require("./routes/properties"));
const stats_1 = __importDefault(require("./routes/stats"));
const notifications_1 = __importDefault(require("./routes/notifications"));
// Initialize Prisma
exports.prisma = new client_1.PrismaClient();
// Initialize Express
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json());
// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/leads', leads_1.default);
app.use('/api/properties', properties_1.default);
app.use('/api/stats', stats_1.default);
app.use('/api/notifications', notifications_1.default);
// Error handler
app.use((err, req, res, next) => {
    console.error('[Error]', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Start server
const startServer = async () => {
    // Start listening first (so health check passes)
    app.listen(PORT, async () => {
        console.log(`[Server] Vestate API running on port ${PORT}`);
        console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
        // Then connect to database
        try {
            await exports.prisma.$connect();
            console.log('[Database] Connected to PostgreSQL');
        }
        catch (error) {
            console.error('[Database] Connection failed:', error);
            console.log('[Database] Will retry on first request...');
        }
    });
};
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('[Server] Shutting down...');
    await exports.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('[Server] Shutting down...');
    await exports.prisma.$disconnect();
    process.exit(0);
});
startServer();
//# sourceMappingURL=index.js.map