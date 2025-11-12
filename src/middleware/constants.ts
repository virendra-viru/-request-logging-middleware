import { LoggerConfig } from './types';

/**
 * Default configuration values for the request logging middleware.
 * 
 * These values are used when no configuration is provided or when
 * specific options are omitted from the user configuration.
 * 
 * @example
 * // Using default configuration
 * import { createRequestLogger, DEFAULT_CONFIG } from './middleware';
 * 
 * console.log(DEFAULT_CONFIG);
 * // Output: { logFilePath: './logs/requests.log', format: 'json', enabled: true, includeIp: false, includeUserAgent: false }
 */
export const DEFAULT_CONFIG: Required<LoggerConfig> = {
  /**
   * Default log file path (relative to application working directory)
   */
  logFilePath: './logs/requests.log',
  
  /**
   * Default log format (JSON for machine-readable structured logs)
   */
  format: 'json',
  
  /**
   * Logging is enabled by default
   */
  enabled: true,
  
  /**
   * IP address logging is disabled by default (privacy consideration)
   */
  includeIp: false,
  
  /**
   * User-Agent logging is disabled by default
   */
  includeUserAgent: false,
};

/**
 * Valid log format options.
 * 
 * This constant defines the allowed values for the format configuration option.
 * 
 * @example
 * import { LOG_FORMATS } from './middleware';
 * 
 * console.log(LOG_FORMATS); // ['json', 'text']
 */
export const LOG_FORMATS = ['json', 'text'] as const;

/**
 * Default log directory path.
 * 
 * The directory where log files are stored by default.
 * This directory will be created automatically if it doesn't exist.
 * 
 * @example
 * import { DEFAULT_LOG_DIR } from './middleware';
 * 
 * console.log(DEFAULT_LOG_DIR); // './logs'
 */
export const DEFAULT_LOG_DIR = './logs';

/**
 * Default log file name.
 * 
 * The default filename used for the log file.
 * Combined with DEFAULT_LOG_DIR to form the complete default path.
 * 
 * @example
 * import { DEFAULT_LOG_FILE } from './middleware';
 * 
 * console.log(DEFAULT_LOG_FILE); // 'requests.log'
 */
export const DEFAULT_LOG_FILE = 'requests.log';
