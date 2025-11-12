/**
 * Configuration options for the request logging middleware.
 * 
 * All options are optional and will be merged with default values.
 * 
 * @example
 * // Minimal configuration
 * const config: LoggerConfig = {};
 * 
 * @example
 * // Full configuration
 * const config: LoggerConfig = {
 *   logFilePath: './logs/app.log',
 *   format: 'json',
 *   enabled: true,
 *   includeIp: true,
 *   includeUserAgent: false
 * };
 */
export interface LoggerConfig {
  /**
   * Path to the log file where requests will be logged.
   * 
   * Can be relative (to the application's working directory) or absolute.
   * The directory will be created automatically if it doesn't exist.
   * 
   * @default './logs/requests.log'
   * 
   * @example
   * // Relative path
   * logFilePath: './logs/requests.log'
   * 
   * @example
   * // Absolute path (production)
   * logFilePath: '/var/log/myapp/requests.log'
   */
  logFilePath?: string;

  /**
   * Format for log entries.
   * 
   * - 'json': Structured JSON format, one object per line (machine-readable)
   * - 'text': Human-readable text format
   * 
   * @default 'json'
   * 
   * @example
   * // JSON format
   * format: 'json'
   * // Output: {"timestamp":"2025-11-10T17:19:12.964Z","method":"GET","url":"/api/books"}
   * 
   * @example
   * // Text format
   * format: 'text'
   * // Output: [2025-11-10T17:19:12.964Z] GET /api/books
   */
  format?: 'json' | 'text';

  /**
   * Enable or disable the logging middleware.
   * 
   * Set to false to temporarily disable logging without removing the middleware.
   * Useful for testing or troubleshooting.
   * 
   * @default true
   * 
   * @example
   * // Disable logging in test environment
   * enabled: process.env.NODE_ENV !== 'test'
   */
  enabled?: boolean;

  /**
   * Include client IP address in log entries.
   * 
   * When enabled, attempts to extract the real client IP from:
   * 1. X-Forwarded-For header (for proxied requests)
   * 2. Socket remote address (direct connections)
   * 
   * Note: Consider privacy implications (GDPR) when logging IP addresses.
   * 
   * @default false
   * 
   * @example
   * includeIp: true
   * // JSON output: {"timestamp":"...","method":"GET","url":"/api/books","ip":"192.168.1.100"}
   * // Text output: [2025-11-10T17:19:12.964Z] GET /api/books - 192.168.1.100
   */
  includeIp?: boolean;

  /**
   * Include User-Agent header in log entries.
   * 
   * Captures the User-Agent header to track client browsers, applications, or bots.
   * Useful for analytics and debugging client-specific issues.
   * 
   * @default false
   * 
   * @example
   * includeUserAgent: true
   * // Output includes: "userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
   */
  includeUserAgent?: boolean;
}

/**
 * Structure of a log entry containing request information.
 * 
 * This interface defines the shape of data captured for each HTTP request.
 * Optional fields (ip, userAgent) are only included when enabled in configuration.
 * 
 * @example
 * // Minimal log entry
 * const entry: LogEntry = {
 *   timestamp: '2025-11-10T17:19:12.964Z',
 *   method: 'GET',
 *   url: '/api/books'
 * };
 * 
 * @example
 * // Full log entry with optional fields
 * const entry: LogEntry = {
 *   timestamp: '2025-11-10T17:19:12.964Z',
 *   method: 'POST',
 *   url: '/api/books',
 *   ip: '192.168.1.100',
 *   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
 * };
 */
export interface LogEntry {
  /**
   * ISO 8601 formatted timestamp of when the request was received.
   * 
   * Always in UTC timezone with millisecond precision.
   * 
   * @example
   * timestamp: '2025-11-10T17:19:12.964Z'
   */
  timestamp: string;

  /**
   * HTTP method used in the request.
   * 
   * Common values: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
   * 
   * @example
   * method: 'GET'
   * method: 'POST'
   */
  method: string;

  /**
   * Full request URL including path and query parameters.
   * 
   * Uses req.originalUrl (preserves original URL) or falls back to req.url.
   * 
   * @example
   * url: '/api/books'
   * url: '/api/books?page=1&limit=10'
   * url: '/api/books/123'
   */
  url: string;

  /**
   * Client IP address (optional, included when includeIp is enabled).
   * 
   * Extracted from X-Forwarded-For header (for proxied requests) or
   * socket remote address (for direct connections).
   * 
   * @example
   * ip: '192.168.1.100'
   * ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
   */
  ip?: string;

  /**
   * User-Agent header from the request (optional, included when includeUserAgent is enabled).
   * 
   * Contains information about the client browser, application, or bot.
   * 
   * @example
   * userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
   * userAgent: 'curl/7.68.0'
   * userAgent: 'PostmanRuntime/7.26.8'
   */
  userAgent?: string;
}
