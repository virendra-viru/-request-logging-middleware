"use strict";
/**
 * Integration tests with Express
 * Tests middleware integration with Express app for various HTTP methods
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const middleware_1 = require("../middleware");
const fs_1 = require("fs");
const path = __importStar(require("path"));
describe('Express Integration Tests', () => {
    let app;
    const testLogDir = './test-logs';
    const testLogFile = path.join(testLogDir, 'integration-test.log');
    // Clean up test logs before and after tests
    beforeEach(async () => {
        try {
            await fs_1.promises.rm(testLogDir, { recursive: true, force: true });
        }
        catch (error) {
            // Ignore if directory doesn't exist
        }
        // Create fresh Express app for each test
        app = (0, express_1.default)();
        app.use(express_1.default.json());
    });
    afterEach(async () => {
        try {
            await fs_1.promises.rm(testLogDir, { recursive: true, force: true });
        }
        catch (error) {
            // Ignore cleanup errors
        }
    });
    describe('HTTP Method Logging', () => {
        beforeEach(() => {
            // Mount middleware
            app.use((0, middleware_1.createRequestLogger)({
                logFilePath: testLogFile,
                format: 'json',
            }));
            // Add test routes
            app.get('/api/books', (req, res) => res.json({ books: [] }));
            app.post('/api/books', (req, res) => res.status(201).json({ id: 1 }));
            app.put('/api/books/:id', (req, res) => res.json({ id: req.params.id }));
            app.delete('/api/books/:id', (req, res) => res.status(204).send());
        });
        it('should log GET requests', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/books')
                .expect(200);
            expect(response.body).toEqual({ books: [] });
            // Wait for async file write
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify log file contains the entry
            const logContent = await fs_1.promises.readFile(testLogFile, 'utf8');
            const logEntry = JSON.parse(logContent.trim());
            expect(logEntry.method).toBe('GET');
            expect(logEntry.url).toBe('/api/books');
            expect(logEntry.timestamp).toBeDefined();
        });
        it('should log POST requests', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/books')
                .send({ title: 'Test Book' })
                .expect(201);
            expect(response.body).toEqual({ id: 1 });
            // Wait for async file write
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify log file contains the entry
            const logContent = await fs_1.promises.readFile(testLogFile, 'utf8');
            const logEntry = JSON.parse(logContent.trim());
            expect(logEntry.method).toBe('POST');
            expect(logEntry.url).toBe('/api/books');
            expect(logEntry.timestamp).toBeDefined();
        });
        it('should log PUT requests', async () => {
            const response = await (0, supertest_1.default)(app)
                .put('/api/books/123')
                .send({ title: 'Updated Book' })
                .expect(200);
            expect(response.body).toEqual({ id: '123' });
            // Wait for async file write
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify log file contains the entry
            const logContent = await fs_1.promises.readFile(testLogFile, 'utf8');
            const logEntry = JSON.parse(logContent.trim());
            expect(logEntry.method).toBe('PUT');
            expect(logEntry.url).toBe('/api/books/123');
            expect(logEntry.timestamp).toBeDefined();
        });
        it('should log DELETE requests', async () => {
            await (0, supertest_1.default)(app)
                .delete('/api/books/456')
                .expect(204);
            // Wait for async file write
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify log file contains the entry
            const logContent = await fs_1.promises.readFile(testLogFile, 'utf8');
            const logEntry = JSON.parse(logContent.trim());
            expect(logEntry.method).toBe('DELETE');
            expect(logEntry.url).toBe('/api/books/456');
            expect(logEntry.timestamp).toBeDefined();
        });
    });
    describe('Log File Verification', () => {
        it('should create log file if it does not exist', async () => {
            app.use((0, middleware_1.createRequestLogger)({
                logFilePath: testLogFile,
                format: 'json',
            }));
            app.get('/test', (req, res) => res.json({ ok: true }));
            await (0, supertest_1.default)(app).get('/test').expect(200);
            // Wait for async file write
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify file exists
            const fileExists = await fs_1.promises.access(testLogFile).then(() => true).catch(() => false);
            expect(fileExists).toBe(true);
        });
        it('should append multiple log entries to the same file', async () => {
            app.use((0, middleware_1.createRequestLogger)({
                logFilePath: testLogFile,
                format: 'json',
            }));
            app.get('/test1', (req, res) => res.json({ test: 1 }));
            app.get('/test2', (req, res) => res.json({ test: 2 }));
            app.get('/test3', (req, res) => res.json({ test: 3 }));
            // Make multiple requests
            await (0, supertest_1.default)(app).get('/test1').expect(200);
            await (0, supertest_1.default)(app).get('/test2').expect(200);
            await (0, supertest_1.default)(app).get('/test3').expect(200);
            // Wait for async file writes
            await new Promise(resolve => setTimeout(resolve, 200));
            // Verify log file contains all entries
            const logContent = await fs_1.promises.readFile(testLogFile, 'utf8');
            const logLines = logContent.trim().split('\n');
            expect(logLines.length).toBe(3);
            const entry1 = JSON.parse(logLines[0]);
            const entry2 = JSON.parse(logLines[1]);
            const entry3 = JSON.parse(logLines[2]);
            expect(entry1.url).toBe('/test1');
            expect(entry2.url).toBe('/test2');
            expect(entry3.url).toBe('/test3');
        });
        it('should log in text format when configured', async () => {
            app.use((0, middleware_1.createRequestLogger)({
                logFilePath: testLogFile,
                format: 'text',
            }));
            app.get('/api/test', (req, res) => res.json({ ok: true }));
            await (0, supertest_1.default)(app).get('/api/test').expect(200);
            // Wait for async file write
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify log file contains text format
            const logContent = await fs_1.promises.readFile(testLogFile, 'utf8');
            expect(logContent).toMatch(/\[.*\] GET \/api\/test\n/);
        });
        it('should include IP address when configured', async () => {
            app.use((0, middleware_1.createRequestLogger)({
                logFilePath: testLogFile,
                format: 'json',
                includeIp: true,
            }));
            app.get('/test', (req, res) => res.json({ ok: true }));
            await (0, supertest_1.default)(app).get('/test').expect(200);
            // Wait for async file write
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify log file contains IP
            const logContent = await fs_1.promises.readFile(testLogFile, 'utf8');
            const logEntry = JSON.parse(logContent.trim());
            expect(logEntry.ip).toBeDefined();
        });
        it('should include User-Agent when configured', async () => {
            app.use((0, middleware_1.createRequestLogger)({
                logFilePath: testLogFile,
                format: 'json',
                includeUserAgent: true,
            }));
            app.get('/test', (req, res) => res.json({ ok: true }));
            await (0, supertest_1.default)(app)
                .get('/test')
                .set('User-Agent', 'TestAgent/1.0')
                .expect(200);
            // Wait for async file write
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify log file contains User-Agent
            const logContent = await fs_1.promises.readFile(testLogFile, 'utf8');
            const logEntry = JSON.parse(logContent.trim());
            expect(logEntry.userAgent).toBe('TestAgent/1.0');
        });
    });
});
//# sourceMappingURL=integration.test.js.map