/**
 * Centralized Logging Utility
 * Provides consistent logging with levels and debug toggles
 */

import { Config } from '@/lib/config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
}

class Logger {
  private isDebugEnabled: boolean;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory

  constructor() {
    this.isDebugEnabled = Config.features.debug;
  }

  private formatTimestamp(date: Date): string {
    return date.toISOString().split('T')[1].split('.')[0];
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = this.formatTimestamp(new Date());
    const levelStr = LogLevel[level].padEnd(5);
    const prefix = `[${timestamp}] ${levelStr}`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
    }
    return `${prefix} ${message}`;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
    };

    // Add to in-memory logs
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Only log to console in debug mode or for errors/warnings
    if (this.isDebugEnabled || level >= LogLevel.WARN) {
      const formattedMessage = this.formatMessage(level, message, data);
      
      switch (level) {
        case LogLevel.DEBUG:
          console.log(`🔍 ${formattedMessage}`);
          break;
        case LogLevel.INFO:
          console.info(`ℹ️ ${formattedMessage}`);
          break;
        case LogLevel.WARN:
          console.warn(`⚠️ ${formattedMessage}`);
          break;
        case LogLevel.ERROR:
          console.error(`❌ ${formattedMessage}`);
          break;
      }
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Enable/disable debug mode at runtime
   */
  setDebugMode(enabled: boolean): void {
    this.isDebugEnabled = enabled;
    this.info(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience methods
export const { debug, info, warn, error } = logger;

// Development helper
if (__DEV__ && Config.features.debug) {
  logger.info('🚀 Logger initialized in debug mode');
}