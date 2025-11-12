"use strict";
/**
 * Unit tests for configuration handling
 * Tests default configuration, custom configuration merging, and validation
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
Object.defineProperty(exports, "__esModule", { value: true });
const middleware_1 = require("../middleware");
const fs_1 = require("fs");
const path = __importStar(require("path"));
describe('Configuration Handling', () => {
    const testLogDir = './test-logs';
    const testLogFile = path.join(testLogDir, 'config-test.log');
    // Clean up test logs before and after tests
    beforeEach(async () => {
        try {
            await fs_1.promises.rm(testLogDir, { recursive: true, force: true });
        }
        catch (error) {
            // Ignore if directory doesn't exist
        }
    });
    afterEach(async () => {
        try {
            await fs_1.promises.rm(testLogDir, { recursive: true, force: true });
        }
        catch (error) {
            // Ignore cleanup errors
        }
    });
    describe('Default Configuration', () => {
        it('should use default log file path when no config provided', () => {
            const middleware = (0, middleware_1.createRequestLogger)();
            expect(middleware).toBeDefined();
            expect(typeof middleware).toBe('function');
            expect(middleware_1.DEFAULT_CONFIG.logFilePath).toBe('./logs/requests.log');
        });
        it('should use default format (json) when no config provided', () => {
            const middleware = (0, middleware_1.createRequestLogger)();
            expect(middleware).toBeDefined();
            expect(middleware_1.DEFAULT_CONFIG.format).toBe('json');
        });
        it('should be enabled by default', () => {
            const middleware = (0, middleware_1.createRequestLogger)();
            expect(middleware).toBeDefined();
            expect(middleware_1.DEFAULT_CONFIG.enabled).toBe(true);
        });
        it('should not include IP by default', () => {
            expect(middleware_1.DEFAULT_CONFIG.includeIp).toBe(false);
        });
        it('should not include User-Agent by default', () => {
            expect(middleware_1.DEFAULT_CONFIG.includeUserAgent).toBe(false);
        });
    });
    describe('Custom Configuration Merging', () => {
        it('should merge custom log file path with defaults', async () => {
            const customConfig = {
                logFilePath: testLogFile,
            };
            const middleware = (0, middleware_1.createRequestLogger)(customConfig);
            // Create mock request and response
            const mockReq = {
                method: 'GET',
                url: '/test',
                originalUrl: '/test',
                headers: {},
                socket: {},
            };
            const mockRes = {};
            const mockNext = jest.fn();
            // Execute middleware
            await middleware(mockReq, mockRes, mockNext);
            // Wait a bit for async file write
            await new Promise(resolve => setTimeout(resolve, 100));
            // Verify file was created at custom path
            const fileExists = await fs_1.promises.access(testLogFile).then(() => true).catch(() => false);
            expect(fileExists).toBe(true);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should merge custom format with defaults', () => {
            const customConfig = {
                format: 'text',
            };
            const middleware = (0, middleware_1.createRequestLogger)(customConfig);
            expect(middleware).toBeDefined();
        });
        it('should merge enabled flag with defaults', async () => {
            const customConfig = {
                enabled: false,
                logFilePath: testLogFile,
            };
            const middleware = (0, middleware_1.createRequestLogger)(customConfig);
            const mockReq = {
                method: 'GET',
                url: '/test',
                originalUrl: '/test',
                headers: {},
                socket: {},
            };
            const mockRes = {};
            const mockNext = jest.fn();
            await middleware(mockReq, mockRes, mockNext);
            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 100));
            // File should not be created when disabled
            const fileExists = await fs_1.promises.access(testLogFile).then(() => true).catch(() => false);
            expect(fileExists).toBe(false);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should merge includeIp flag with defaults', () => {
            const customConfig = {
                includeIp: true,
            };
            const middleware = (0, middleware_1.createRequestLogger)(customConfig);
            expect(middleware).toBeDefined();
        });
        it('should merge includeUserAgent flag with defaults', () => {
            const customConfig = {
                includeUserAgent: true,
            };
            const middleware = (0, middleware_1.createRequestLogger)(customConfig);
            expect(middleware).toBeDefined();
        });
        it('should merge multiple custom options with defaults', () => {
            const customConfig = {
                logFilePath: testLogFile,
                format: 'text',
                includeIp: true,
                includeUserAgent: true,
            };
            const middleware = (0, middleware_1.createRequestLogger)(customConfig);
            expect(middleware).toBeDefined();
        });
    });
    describe('Configuration Validation', () => {
        it('should fallback to json format for invalid format value', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            const customConfig = {
                format: 'invalid',
            };
            const middleware = (0, middleware_1.createRequestLogger)(customConfig);
            expect(middleware).toBeDefined();
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid log format'));
            consoleWarnSpy.mockRestore();
        });
        it('should use default path for invalid logFilePath type', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            const customConfig = {
                logFilePath: 123,
            };
            const middleware = (0, middleware_1.createRequestLogger)(customConfig);
            expect(middleware).toBeDefined();
            expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid logFilePath'));
            consoleWarnSpy.mockRestore();
        });
        it('should handle empty configuration object', () => {
            const middleware = (0, middleware_1.createRequestLogger)({});
            expect(middleware).toBeDefined();
        });
        it('should handle undefined configuration', () => {
            const middleware = (0, middleware_1.createRequestLogger)(undefined);
            expect(middleware).toBeDefined();
        });
    });
});
//# sourceMappingURL=configuration.test.js.map