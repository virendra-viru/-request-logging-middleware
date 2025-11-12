"use strict";
/**
 * Error handling tests
 * Tests middleware behavior when file system errors occur
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
describe('Error Handling Tests', () => {
    let app;
    const testLogDir = './test-logs';
    const testLogFile = path.join(testLogDir, 'error-test.log');
    beforeEach(async () => {
        try {
            await fs_1.promises.rm(testLogDir, { recursive: true, force: true });
        }
        catch (error) {
            // Ignore if directory doesn't exist
        }
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
    describe('File System Error Handling', () => {
        it('should catch and log errors without crashing', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            // Use an invalid path that will cause an error
            const invalidPath = '\0invalid\0path';
            app.use((0, middleware_1.createRequestLogger)({
                logFilePath: invalidPath,
                format: 'json',
            }));
            app.get('/test', (req, res) => res.json({ ok: true }));
            // Request should still succeed despite logging error
            const response = await (0, supertest_1.default)(app).get('/test').expect(200);
            expect(response.body).toEqual({ ok: true });
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify error was logged to console
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(consoleErrorSpy.mock.calls[0][0]).toContain('[Request Logger] Failed to log request');
            consoleErrorSpy.mockRestore();
        });
        it('should continue processing requests when logging fails', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            // Mock fs.appendFile to simulate EACCES error
            const originalAppendFile = fs_1.promises.appendFile;
            const mockAppendFile = jest.fn().mockRejectedValue(Object.assign(new Error('Permission denied'), { code: 'EACCES' }));
            fs_1.promises.appendFile = mockAppendFile;
            app.use((0, middleware_1.createRequestLogger)({
                logFilePath: testLogFile,
                format: 'json',
            }));
            app.get('/test', (req, res) => res.json({ ok: true }));
            // Request should succeed
            const response = await (0, supertest_1.default)(app).get('/test').expect(200);
            expect(response.body).toEqual({ ok: true });
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify error was logged
            expect(consoleErrorSpy).toHaveBeenCalled();
            // Restore original function
            fs_1.promises.appendFile = originalAppendFile;
            consoleErrorSpy.mockRestore();
        });
        it('should handle ENOSPC (no space left) error gracefully', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            // Mock fs.appendFile to simulate ENOSPC error
            const originalAppendFile = fs_1.promises.appendFile;
            const mockAppendFile = jest.fn().mockRejectedValue(Object.assign(new Error('No space left on device'), { code: 'ENOSPC' }));
            fs_1.promises.appendFile = mockAppendFile;
            app.use((0, middleware_1.createRequestLogger)({
                logFilePath: testLogFile,
                format: 'json',
            }));
            app.get('/test', (req, res) => res.json({ ok: true }));
            // Request should succeed
            const response = await (0, supertest_1.default)(app).get('/test').expect(200);
            expect(response.body).toEqual({ ok: true });
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify error was logged
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(consoleErrorSpy.mock.calls[0][0]).toContain('ENOSPC');
            // Restore original function
            fs_1.promises.appendFile = originalAppendFile;
            consoleErrorSpy.mockRestore();
        });
        it('should handle generic file system errors', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            // Mock fs.mkdir to simulate a generic error
            const originalMkdir = fs_1.promises.mkdir;
            const mockMkdir = jest.fn().mockRejectedValue(new Error('Generic file system error'));
            fs_1.promises.mkdir = mockMkdir;
            app.use((0, middleware_1.createRequestLogger)({
                logFilePath: testLogFile,
                format: 'json',
            }));
            app.get('/test', (req, res) => res.json({ ok: true }));
            // Request should succeed
            const response = await (0, supertest_1.default)(app).get('/test').expect(200);
            expect(response.body).toEqual({ ok: true });
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify error was logged
            expect(consoleErrorSpy).toHaveBeenCalled();
            // Restore original function
            fs_1.promises.mkdir = originalMkdir;
            consoleErrorSpy.mockRestore();
        });
    });
    describe('Invalid Configuration Handling', () => {
        it('should handle invalid format gracefully', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            app.use((0, middleware_1.createRequestLogger)({
                logFilePath: testLogFile,
                format: 'invalid-format',
            }));
            app.get('/test', (req, res) => res.json({ ok: true }));
            // Request should succeed
            const response = await (0, supertest_1.default)(app).get('/test').expect(200);
            expect(response.body).toEqual({ ok: true });
            // Verify warning was logged
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid log format'));
            consoleWarnSpy.mockRestore();
        });
        it('should handle invalid logFilePath type gracefully', async () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            app.use((0, middleware_1.createRequestLogger)({
                logFilePath: 12345,
            }));
            app.get('/test', (req, res) => res.json({ ok: true }));
            // Request should succeed
            const response = await (0, supertest_1.default)(app).get('/test').expect(200);
            expect(response.body).toEqual({ ok: true });
            // Verify warning was logged
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid logFilePath'));
            consoleWarnSpy.mockRestore();
        });
    });
    describe('Middleware Chain Continuation', () => {
        it('should call next() even when logging fails', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const nextSpy = jest.fn((req, res) => res.json({ ok: true }));
            // Mock fs.appendFile to simulate error
            const originalAppendFile = fs_1.promises.appendFile;
            const mockAppendFile = jest.fn().mockRejectedValue(new Error('Simulated error'));
            fs_1.promises.appendFile = mockAppendFile;
            app.use((0, middleware_1.createRequestLogger)({
                logFilePath: testLogFile,
                format: 'json',
            }));
            app.get('/test', nextSpy);
            // Request should succeed
            await (0, supertest_1.default)(app).get('/test').expect(200);
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify next was called
            expect(nextSpy).toHaveBeenCalled();
            // Restore original function
            fs_1.promises.appendFile = originalAppendFile;
            consoleErrorSpy.mockRestore();
        });
        it('should call next() when logging is disabled', async () => {
            const nextSpy = jest.fn((req, res) => res.json({ ok: true }));
            app.use((0, middleware_1.createRequestLogger)({
                enabled: false,
                logFilePath: testLogFile,
            }));
            app.get('/test', nextSpy);
            // Request should succeed
            await (0, supertest_1.default)(app).get('/test').expect(200);
            // Verify next was called
            expect(nextSpy).toHaveBeenCalled();
        });
        it('should process multiple requests despite logging errors', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            // Mock fs.appendFile to simulate error
            const originalAppendFile = fs_1.promises.appendFile;
            const mockAppendFile = jest.fn().mockRejectedValue(new Error('Simulated error'));
            fs_1.promises.appendFile = mockAppendFile;
            app.use((0, middleware_1.createRequestLogger)({
                logFilePath: testLogFile,
                format: 'json',
            }));
            app.get('/test', (req, res) => res.json({ ok: true }));
            // Make multiple requests
            await (0, supertest_1.default)(app).get('/test').expect(200);
            await (0, supertest_1.default)(app).get('/test').expect(200);
            await (0, supertest_1.default)(app).get('/test').expect(200);
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));
            // All requests should have succeeded
            expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
            // Restore original function
            fs_1.promises.appendFile = originalAppendFile;
            consoleErrorSpy.mockRestore();
        });
    });
});
//# sourceMappingURL=error-handling.test.js.map