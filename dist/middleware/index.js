"use strict";
/**
 * Request Logging Middleware
 *
 * This module provides Express middleware for logging incoming HTTP requests
 * to a file with configurable format and options.
 *
 * @module middleware
 *
 * @example
 * // Basic usage with default configuration
 * import express from 'express';
 * import { createRequestLogger } from './middleware';
 *
 * const app = express();
 * app.use(createRequestLogger());
 *
 * @example
 * // Custom configuration
 * import { createRequestLogger } from './middleware';
 *
 * app.use(createRequestLogger({
 *   logFilePath: './logs/app.log',
 *   format: 'text',
 *   includeIp: true,
 *   includeUserAgent: true
 * }));
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
exports.DEFAULT_LOG_FILE = exports.DEFAULT_LOG_DIR = exports.LOG_FORMATS = exports.DEFAULT_CONFIG = void 0;
exports.createRequestLogger = createRequestLogger;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const constants_1 = require("./constants");
var constants_2 = require("./constants");
Object.defineProperty(exports, "DEFAULT_CONFIG", { enumerable: true, get: function () { return constants_2.DEFAULT_CONFIG; } });
Object.defineProperty(exports, "LOG_FORMATS", { enumerable: true, get: function () { return constants_2.LOG_FORMATS; } });
Object.defineProperty(exports, "DEFAULT_LOG_DIR", { enumerable: true, get: function () { return constants_2.DEFAULT_LOG_DIR; } });
Object.defineProperty(exports, "DEFAULT_LOG_FILE", { enumerable: true, get: function () { return constants_2.DEFAULT_LOG_FILE; } });
/**
 * Validates and merges user configuration with default values.
 *
 * This function ensures that all configuration options have valid values by:
 * - Merging user-provided config with defaults
 * - Validating the format option (must be 'json' or 'text')
 * - Validating the logFilePath option (must be a string)
 * - Logging warnings for invalid values and falling back to defaults
 *
 * @param config - User-provided configuration options (optional)
 * @returns Merged configuration with all required fields populated
 *
 * @example
 * const config = validateAndMergeConfig({ format: 'text' });
 * // Returns: { logFilePath: './logs/requests.log', format: 'text', enabled: true, includeIp: false, includeUserAgent: false }
 */
function validateAndMergeConfig(config) {
    const mergedConfig = {
        ...constants_1.DEFAULT_CONFIG,
        ...config,
    };
    // Validate format option
    if (config?.format && !['json', 'text'].includes(config.format)) {
        console.warn(`Invalid log format "${config.format}". Falling back to "json".`);
        mergedConfig.format = 'json';
    }
    // Validate logFilePath
    if (config?.logFilePath && typeof config.logFilePath !== 'string') {
        console.warn('Invalid logFilePath. Using default.');
        mergedConfig.logFilePath = constants_1.DEFAULT_CONFIG.logFilePath;
    }
    return mergedConfig;
}
/**
 * Creates a request logging middleware with the specified configuration.
 *
 * This is the main factory function that creates and returns an Express middleware
 * function configured to log incoming HTTP requests to a file. The middleware:
 * - Captures request method, URL, timestamp, and optionally IP and User-Agent
 * - Formats log entries as JSON or text based on configuration
 * - Writes logs asynchronously to avoid blocking the event loop
 * - Handles errors gracefully without crashing the application
 * - Always calls next() to continue request processing
 *
 * @param config - Optional configuration for the logging middleware
 * @param config.logFilePath - Path to the log file (default: './logs/requests.log')
 * @param config.format - Log format: 'json' or 'text' (default: 'json')
 * @param config.enabled - Enable or disable logging (default: true)
 * @param config.includeIp - Include client IP address (default: false)
 * @param config.includeUserAgent - Include User-Agent header (default: false)
 *
 * @returns Express middleware function that logs incoming requests
 *
 * @example
 * // Basic usage with defaults
 * import express from 'express';
 * import { createRequestLogger } from './middleware';
 *
 * const app = express();
 * app.use(createRequestLogger());
 *
 * @example
 * // Custom configuration
 * app.use(createRequestLogger({
 *   logFilePath: './logs/app.log',
 *   format: 'text',
 *   includeIp: true
 * }));
 *
 * @example
 * // Environment-specific configuration
 * const logConfig = process.env.NODE_ENV === 'production'
 *   ? { logFilePath: '/var/log/myapp/requests.log', format: 'json' as const }
 *   : { logFilePath: './logs/requests.log', format: 'text' as const };
 *
 * app.use(createRequestLogger(logConfig));
 */
function createRequestLogger(config) {
    // Validate and merge configuration with defaults
    const finalConfig = validateAndMergeConfig(config);
    // Return the configured middleware function
    return async (req, res, next) => {
        try {
            // If logging is disabled, skip to next middleware
            if (!finalConfig.enabled) {
                return;
            }
            // Capture request data
            const logEntry = captureRequestData(req, finalConfig);
            // Select the appropriate formatter based on configuration
            const formatter = selectFormatter(finalConfig.format);
            // Format the log entry
            const formattedEntry = formatter(logEntry);
            // Write the formatted entry to the log file asynchronously
            await appendToLogFile(finalConfig.logFilePath, formattedEntry);
        }
        catch (error) {
            // Log error with descriptive message but don't throw
            // Logging failures should never crash the application
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorCode = error instanceof Error && 'code' in error ? error.code : 'UNKNOWN';
            console.error(`[Request Logger] Failed to log request ${req.method} ${req.url}: ${errorMessage} (Error code: ${errorCode})`);
        }
        finally {
            // Always call next() to continue request processing
            // This ensures the request continues even if logging fails
            next();
        }
    };
}
/**
 * Captures request data from the Express request object.
 *
 * Extracts relevant information from the incoming HTTP request including:
 * - Timestamp (current time in ISO 8601 format)
 * - HTTP method (GET, POST, PUT, DELETE, etc.)
 * - Request URL (full path with query parameters)
 * - Client IP address (if enabled, attempts to extract from X-Forwarded-For header)
 * - User-Agent header (if enabled)
 *
 * @param req - Express request object containing request information
 * @param config - Middleware configuration specifying which fields to capture
 * @returns LogEntry object with captured request data
 *
 * @example
 * const logEntry = captureRequestData(req, config);
 * // Returns: { timestamp: '2025-11-10T17:19:12.964Z', method: 'GET', url: '/api/books', ip: '192.168.1.100' }
 */
function captureRequestData(req, config) {
    // Create base log entry with required fields
    const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
    };
    // Optionally capture IP address
    if (config.includeIp) {
        // Try to get real IP from proxy headers, fallback to socket IP
        logEntry.ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
            || req.socket.remoteAddress
            || 'unknown';
    }
    // Optionally capture User-Agent header
    if (config.includeUserAgent) {
        logEntry.userAgent = req.headers['user-agent'] || 'unknown';
    }
    return logEntry;
}
/**
 * Formats a log entry as a JSON string with newline.
 *
 * Converts the LogEntry object to a compact JSON string (no pretty-printing)
 * and appends a newline character for proper file appending.
 *
 * @param logEntry - The log entry to format
 * @returns JSON string representation with newline character
 *
 * @example
 * const formatted = formatAsJson({ timestamp: '2025-11-10T17:19:12.964Z', method: 'GET', url: '/api/books' });
 * // Returns: '{"timestamp":"2025-11-10T17:19:12.964Z","method":"GET","url":"/api/books"}\n'
 */
function formatAsJson(logEntry) {
    return JSON.stringify(logEntry) + '\n';
}
/**
 * Formats a log entry as human-readable text with newline.
 *
 * Creates a text string in the format: [timestamp] METHOD /url - ip - userAgent
 * Optional fields (ip, userAgent) are only included if present in the log entry.
 *
 * @param logEntry - The log entry to format
 * @returns Text string in format: [timestamp] METHOD /url - ip - userAgent
 *
 * @example
 * const formatted = formatAsText({ timestamp: '2025-11-10T17:19:12.964Z', method: 'GET', url: '/api/books', ip: '192.168.1.100' });
 * // Returns: '[2025-11-10T17:19:12.964Z] GET /api/books - 192.168.1.100\n'
 */
function formatAsText(logEntry) {
    let text = `[${logEntry.timestamp}] ${logEntry.method} ${logEntry.url}`;
    if (logEntry.ip) {
        text += ` - ${logEntry.ip}`;
    }
    if (logEntry.userAgent) {
        text += ` - ${logEntry.userAgent}`;
    }
    return text + '\n';
}
/**
 * Selects the appropriate formatter based on configuration.
 *
 * Returns the formatter function that matches the requested format.
 * Defaults to JSON formatter for any invalid format values.
 *
 * @param format - The desired log format ('json' or 'text')
 * @returns Formatter function that converts LogEntry to string
 *
 * @example
 * const formatter = selectFormatter('json');
 * const formatted = formatter(logEntry);
 */
function selectFormatter(format) {
    if (format === 'text') {
        return formatAsText;
    }
    // Default to JSON for any other value (including invalid ones)
    return formatAsJson;
}
/**
 * Ensures the log directory exists, creating it recursively if necessary.
 *
 * Extracts the directory path from the log file path and creates all necessary
 * parent directories. Handles common file system errors with descriptive messages:
 * - EEXIST: Directory already exists (no action needed)
 * - EACCES: Permission denied
 * - ENOSPC: No space left on device
 *
 * @param logFilePath - Full path to the log file
 * @throws Error if directory creation fails with specific error handling
 *
 * @example
 * await ensureLogDirectory('./logs/requests.log');
 * // Creates './logs' directory if it doesn't exist
 */
async function ensureLogDirectory(logFilePath) {
    const logDir = path.dirname(logFilePath);
    try {
        // Create directory recursively if it doesn't exist
        await fs_1.promises.mkdir(logDir, { recursive: true });
    }
    catch (error) {
        const nodeError = error;
        // EEXIST error means directory already exists - this is fine
        if (nodeError.code === 'EEXIST') {
            // Directory already exists, no action needed
            return;
        }
        // Handle specific file system errors with descriptive messages
        if (nodeError.code === 'EACCES') {
            throw new Error(`Permission denied: Cannot create log directory at ${logDir}. Check file system permissions.`);
        }
        if (nodeError.code === 'ENOSPC') {
            throw new Error(`No space left on device: Cannot create log directory at ${logDir}.`);
        }
        // Re-throw other errors with enhanced context
        throw new Error(`Failed to create log directory at ${logDir}: ${nodeError.message}`);
    }
}
/**
 * Appends a formatted log entry to the log file asynchronously.
 *
 * This function:
 * 1. Ensures the log directory exists (creates it if necessary)
 * 2. Appends the formatted entry to the log file (creates file if it doesn't exist)
 * 3. Uses asynchronous file operations to avoid blocking the event loop
 * 4. Handles specific file system errors with descriptive messages
 *
 * Common errors handled:
 * - ENOENT: File or directory doesn't exist
 * - EACCES: Permission denied
 * - ENOSPC: No space left on device
 *
 * @param logFilePath - Path to the log file
 * @param formattedEntry - The formatted log entry string to append
 * @returns Promise that resolves when the write is complete
 * @throws Error with specific messages for different file system errors
 *
 * @example
 * await appendToLogFile('./logs/requests.log', '{"timestamp":"2025-11-10T17:19:12.964Z","method":"GET","url":"/api/books"}\n');
 */
async function appendToLogFile(logFilePath, formattedEntry) {
    try {
        // Ensure the log directory exists before writing
        await ensureLogDirectory(logFilePath);
        // Append the log entry to the file (creates file if it doesn't exist)
        await fs_1.promises.appendFile(logFilePath, formattedEntry, 'utf8');
    }
    catch (error) {
        const nodeError = error;
        // Handle specific file system errors
        if (nodeError.code === 'ENOENT') {
            // This shouldn't happen after ensureLogDirectory, but handle it anyway
            throw new Error(`Log file path does not exist: ${logFilePath}. Failed to create directory structure.`);
        }
        if (nodeError.code === 'EACCES') {
            throw new Error(`Permission denied: Cannot write to log file at ${logFilePath}. Check file system permissions.`);
        }
        if (nodeError.code === 'ENOSPC') {
            throw new Error(`No space left on device: Cannot write to log file at ${logFilePath}.`);
        }
        // Generic error with fallback logging to console
        throw new Error(`Failed to write to log file at ${logFilePath}: ${nodeError.message || String(error)}`);
    }
}
//# sourceMappingURL=index.js.map