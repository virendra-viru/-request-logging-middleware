"use strict";
/**
 * Server Entry Point
 *
 * Starts the Express application and listens on the configured port
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 3000;
// Start the server
const server = app_1.default.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Request logging is enabled - logs will be written to ./logs/requests.log`);
    console.log(`\nTry these endpoints:`);
    console.log(`  GET  http://localhost:${PORT}/health`);
    console.log(`  GET  http://localhost:${PORT}/api/books`);
    console.log(`  POST http://localhost:${PORT}/api/books`);
    console.log(`  PUT  http://localhost:${PORT}/api/books/1`);
    console.log(`  DELETE http://localhost:${PORT}/api/books/1`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
exports.default = server;
//# sourceMappingURL=server.js.map