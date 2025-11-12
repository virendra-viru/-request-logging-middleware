/**
 * Unit tests for configuration handling
 * Tests default configuration, custom configuration merging, and validation
 */

import { createRequestLogger, DEFAULT_CONFIG } from '../middleware';
import { Request, Response, NextFunction } from 'express';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('Configuration Handling', () => {
  const testLogDir = './test-logs';
  const testLogFile = path.join(testLogDir, 'config-test.log');

  // Clean up test logs before and after tests
  beforeEach(async () => {
    try {
      await fs.rm(testLogDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  });

  afterEach(async () => {
    try {
      await fs.rm(testLogDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Default Configuration', () => {
    it('should use default log file path when no config provided', () => {
      const middleware = createRequestLogger();
      
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
      expect(DEFAULT_CONFIG.logFilePath).toBe('./logs/requests.log');
    });

    it('should use default format (json) when no config provided', () => {
      const middleware = createRequestLogger();
      
      expect(middleware).toBeDefined();
      expect(DEFAULT_CONFIG.format).toBe('json');
    });

    it('should be enabled by default', () => {
      const middleware = createRequestLogger();
      
      expect(middleware).toBeDefined();
      expect(DEFAULT_CONFIG.enabled).toBe(true);
    });

    it('should not include IP by default', () => {
      expect(DEFAULT_CONFIG.includeIp).toBe(false);
    });

    it('should not include User-Agent by default', () => {
      expect(DEFAULT_CONFIG.includeUserAgent).toBe(false);
    });
  });

  describe('Custom Configuration Merging', () => {
    it('should merge custom log file path with defaults', async () => {
      const customConfig = {
        logFilePath: testLogFile,
      };

      const middleware = createRequestLogger(customConfig);
      
      // Create mock request and response
      const mockReq = {
        method: 'GET',
        url: '/test',
        originalUrl: '/test',
        headers: {},
        socket: {},
      } as Request;

      const mockRes = {} as Response;
      const mockNext = jest.fn();

      // Execute middleware
      await middleware(mockReq, mockRes, mockNext);

      // Wait a bit for async file write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify file was created at custom path
      const fileExists = await fs.access(testLogFile).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should merge custom format with defaults', () => {
      const customConfig = {
        format: 'text' as const,
      };

      const middleware = createRequestLogger(customConfig);
      
      expect(middleware).toBeDefined();
    });

    it('should merge enabled flag with defaults', async () => {
      const customConfig = {
        enabled: false,
        logFilePath: testLogFile,
      };

      const middleware = createRequestLogger(customConfig);
      
      const mockReq = {
        method: 'GET',
        url: '/test',
        originalUrl: '/test',
        headers: {},
        socket: {},
      } as Request;

      const mockRes = {} as Response;
      const mockNext = jest.fn();

      await middleware(mockReq, mockRes, mockNext);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // File should not be created when disabled
      const fileExists = await fs.access(testLogFile).then(() => true).catch(() => false);
      expect(fileExists).toBe(false);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should merge includeIp flag with defaults', () => {
      const customConfig = {
        includeIp: true,
      };

      const middleware = createRequestLogger(customConfig);
      
      expect(middleware).toBeDefined();
    });

    it('should merge includeUserAgent flag with defaults', () => {
      const customConfig = {
        includeUserAgent: true,
      };

      const middleware = createRequestLogger(customConfig);
      
      expect(middleware).toBeDefined();
    });

    it('should merge multiple custom options with defaults', () => {
      const customConfig = {
        logFilePath: testLogFile,
        format: 'text' as const,
        includeIp: true,
        includeUserAgent: true,
      };

      const middleware = createRequestLogger(customConfig);
      
      expect(middleware).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should fallback to json format for invalid format value', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const customConfig = {
        format: 'invalid' as any,
      };

      const middleware = createRequestLogger(customConfig);
      
      expect(middleware).toBeDefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid log format')
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should use default path for invalid logFilePath type', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const customConfig = {
        logFilePath: 123 as any,
      };

      const middleware = createRequestLogger(customConfig);
      
      expect(middleware).toBeDefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid logFilePath')
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should handle empty configuration object', () => {
      const middleware = createRequestLogger({});
      
      expect(middleware).toBeDefined();
    });

    it('should handle undefined configuration', () => {
      const middleware = createRequestLogger(undefined);
      
      expect(middleware).toBeDefined();
    });
  });
});
