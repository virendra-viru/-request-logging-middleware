/**
 * Error handling tests
 * Tests middleware behavior when file system errors occur
 */

import express, { Express } from 'express';
import request from 'supertest';
import { createRequestLogger } from '../middleware';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('Error Handling Tests', () => {
  let app: Express;
  const testLogDir = './test-logs';
  const testLogFile = path.join(testLogDir, 'error-test.log');

  beforeEach(async () => {
    try {
      await fs.rm(testLogDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }

    app = express();
    app.use(express.json());
  });

  afterEach(async () => {
    try {
      await fs.rm(testLogDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('File System Error Handling', () => {
    it('should catch and log errors without crashing', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Use an invalid path that will cause an error
      const invalidPath = '\0invalid\0path';
      
      app.use(createRequestLogger({
        logFilePath: invalidPath,
        format: 'json',
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // Request should still succeed despite logging error
      const response = await request(app).get('/test').expect(200);

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
      const originalAppendFile = fs.appendFile;
      const mockAppendFile = jest.fn().mockRejectedValue(
        Object.assign(new Error('Permission denied'), { code: 'EACCES' })
      );
      (fs as any).appendFile = mockAppendFile;

      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // Request should succeed
      const response = await request(app).get('/test').expect(200);

      expect(response.body).toEqual({ ok: true });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore original function
      (fs as any).appendFile = originalAppendFile;
      consoleErrorSpy.mockRestore();
    });

    it('should handle ENOSPC (no space left) error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock fs.appendFile to simulate ENOSPC error
      const originalAppendFile = fs.appendFile;
      const mockAppendFile = jest.fn().mockRejectedValue(
        Object.assign(new Error('No space left on device'), { code: 'ENOSPC' })
      );
      (fs as any).appendFile = mockAppendFile;

      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // Request should succeed
      const response = await request(app).get('/test').expect(200);

      expect(response.body).toEqual({ ok: true });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('ENOSPC');

      // Restore original function
      (fs as any).appendFile = originalAppendFile;
      consoleErrorSpy.mockRestore();
    });

    it('should handle generic file system errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock fs.mkdir to simulate a generic error
      const originalMkdir = fs.mkdir;
      const mockMkdir = jest.fn().mockRejectedValue(
        new Error('Generic file system error')
      );
      (fs as any).mkdir = mockMkdir;

      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // Request should succeed
      const response = await request(app).get('/test').expect(200);

      expect(response.body).toEqual({ ok: true });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore original function
      (fs as any).mkdir = originalMkdir;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Invalid Configuration Handling', () => {
    it('should handle invalid format gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'invalid-format' as any,
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // Request should succeed
      const response = await request(app).get('/test').expect(200);

      expect(response.body).toEqual({ ok: true });

      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid log format')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle invalid logFilePath type gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      app.use(createRequestLogger({
        logFilePath: 12345 as any,
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // Request should succeed
      const response = await request(app).get('/test').expect(200);

      expect(response.body).toEqual({ ok: true });

      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid logFilePath')
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Middleware Chain Continuation', () => {
    it('should call next() even when logging fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const nextSpy = jest.fn((req, res) => res.json({ ok: true }));

      // Mock fs.appendFile to simulate error
      const originalAppendFile = fs.appendFile;
      const mockAppendFile = jest.fn().mockRejectedValue(
        new Error('Simulated error')
      );
      (fs as any).appendFile = mockAppendFile;

      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
      }));

      app.get('/test', nextSpy);

      // Request should succeed
      await request(app).get('/test').expect(200);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify next was called
      expect(nextSpy).toHaveBeenCalled();

      // Restore original function
      (fs as any).appendFile = originalAppendFile;
      consoleErrorSpy.mockRestore();
    });

    it('should call next() when logging is disabled', async () => {
      const nextSpy = jest.fn((req, res) => res.json({ ok: true }));

      app.use(createRequestLogger({
        enabled: false,
        logFilePath: testLogFile,
      }));

      app.get('/test', nextSpy);

      // Request should succeed
      await request(app).get('/test').expect(200);

      // Verify next was called
      expect(nextSpy).toHaveBeenCalled();
    });

    it('should process multiple requests despite logging errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock fs.appendFile to simulate error
      const originalAppendFile = fs.appendFile;
      const mockAppendFile = jest.fn().mockRejectedValue(
        new Error('Simulated error')
      );
      (fs as any).appendFile = mockAppendFile;

      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // Make multiple requests
      await request(app).get('/test').expect(200);
      await request(app).get('/test').expect(200);
      await request(app).get('/test').expect(200);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // All requests should have succeeded
      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);

      // Restore original function
      (fs as any).appendFile = originalAppendFile;
      consoleErrorSpy.mockRestore();
    });
  });
});
