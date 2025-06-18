/**
 * LoggerService - A utility for controlled logging
 *
 * This service replaces direct console.log calls throughout the codebase
 * with a controlled logging mechanism that can be:
 * 1. Disabled in production
 * 2. Filtered by log level
 * 3. Formatted consistently
 */

// Log levels in order of severity
export const LOG_LEVEL = {
  DEBUG: 0, // Detailed debugging information
  INFO: 1, // Interesting runtime events
  WARN: 2, // Potentially harmful situations
  ERROR: 3, // Runtime errors that don't stop the application
  NONE: 4, // No logging
};

// Default configuration
const defaultConfig = {
  // In production, only show warnings and errors
  // In development, show all logs
  minLevel: import.meta.env.PROD ? LOG_LEVEL.WARN : LOG_LEVEL.DEBUG,

  // Whether to include timestamps in logs
  showTimestamps: true,

  // Whether to include the component/module name in logs
  showSource: true,

  // Whether to include the log level in logs
  showLevel: true,
};

// Current configuration (can be updated at runtime)
let config = { ...defaultConfig };

/**
 * Configure the logger
 * @param {Object} newConfig - New configuration options
 */
export function configureLogger(newConfig) {
  config = { ...config, ...newConfig };
}

/**
 * Reset logger configuration to defaults
 */
export function resetLoggerConfig() {
  config = { ...defaultConfig };
}

/**
 * Format a log message
 * @param {string} level - Log level name
 * @param {string} source - Source of the log (component/module name)
 * @param {string} message - Log message
 * @returns {string} - Formatted log message
 */
function formatLogMessage(level, source, message) {
  const parts = [];

  // Add timestamp if configured
  if (config.showTimestamps) {
    const now = new Date();
    const timestamp = now.toISOString().split('T')[1].split('.')[0];
    parts.push(`[${timestamp}]`);
  }

  // Add log level if configured
  if (config.showLevel) {
    parts.push(`[${level}]`);
  }

  // Add source if configured and provided
  if (config.showSource && source) {
    parts.push(`[${source}]`);
  }

  // Add the message
  parts.push(message);

  return parts.join(' ');
}

/**
 * Log a message if the level is at or above the configured minimum level
 * @param {number} level - Log level (from LOG_LEVEL enum)
 * @param {string} source - Source of the log (component/module name)
 * @param {string} message - Log message
 * @param {any[]} args - Additional arguments to log
 */
function log(level, source, message, ...args) {
  // Skip logging if level is below the configured minimum
  if (level < config.minLevel) {
    return;
  }

  // Get the appropriate console method
  let method;
  let levelName;

  switch (level) {
    case LOG_LEVEL.DEBUG:
      method = console.debug;
      levelName = 'DEBUG';
      break;
    case LOG_LEVEL.INFO:
      method = console.info;
      levelName = 'INFO';
      break;
    case LOG_LEVEL.WARN:
      method = console.warn;
      levelName = 'WARN';
      break;
    case LOG_LEVEL.ERROR:
      method = console.error;
      levelName = 'ERROR';
      break;
    default:
      return; // Unknown level, don't log
  }

  // Format the message
  const formattedMessage = formatLogMessage(levelName, source, message);

  // Log the message and any additional arguments
  if (args.length > 0) {
    method(formattedMessage, ...args);
  } else {
    method(formattedMessage);
  }
}

/**
 * Create a logger instance for a specific source
 * @param {string} source - Source name (component/module)
 * @returns {Object} - Logger instance with debug, info, warn, and error methods
 */
export function createLogger(source) {
  return {
    debug: (message, ...args) => log(LOG_LEVEL.DEBUG, source, message, ...args),
    info: (message, ...args) => log(LOG_LEVEL.INFO, source, message, ...args),
    warn: (message, ...args) => log(LOG_LEVEL.WARN, source, message, ...args),
    error: (message, ...args) => log(LOG_LEVEL.ERROR, source, message, ...args),

    // Allow changing the source for this logger instance
    withSource: (newSource) => createLogger(newSource),
  };
}

// Create a default logger with no source
export const logger = createLogger(null);

// Export a function to disable all logging (useful for tests)
export function disableLogging() {
  configureLogger({ minLevel: LOG_LEVEL.NONE });
}

// Export a function to enable all logging
export function enableAllLogging() {
  configureLogger({ minLevel: LOG_LEVEL.DEBUG });
}
