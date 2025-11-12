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
export declare const DEFAULT_CONFIG: Required<LoggerConfig>;
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
export declare const LOG_FORMATS: readonly ["json", "text"];
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
export declare const DEFAULT_LOG_DIR = "./logs";
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
export declare const DEFAULT_LOG_FILE = "requests.log";
//# sourceMappingURL=constants.d.ts.map