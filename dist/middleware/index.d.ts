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
import { RequestHandler } from 'express';
import { LoggerConfig } from './types';
export { LoggerConfig, LogEntry } from './types';
export { DEFAULT_CONFIG, LOG_FORMATS, DEFAULT_LOG_DIR, DEFAULT_LOG_FILE } from './constants';
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
export declare function createRequestLogger(config?: LoggerConfig): RequestHandler;
//# sourceMappingURL=index.d.ts.map