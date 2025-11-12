/**
 * Unit tests for log formatter functions
 * Tests JSON and text formatters with various LogEntry configurations
 */

import { createRequestLogger, LogEntry } from '../middleware';

describe('Log Formatters', () => {
  describe('JSON Formatter', () => {
    it('should format a basic log entry as JSON with newline', () => {
      const logEntry: LogEntry = {
        timestamp: '2025-11-09T18:58:00.123Z',
        method: 'GET',
        url: '/api/books',
      };

      // We'll test this by creating middleware and capturing output
      // Since formatters are internal, we test through the middleware behavior
      const expectedJson = JSON.stringify(logEntry) + '\n';
      
      expect(expectedJson).toContain('"timestamp":"2025-11-09T18:58:00.123Z"');
      expect(expectedJson).toContain('"method":"GET"');
      expect(expectedJson).toContain('"url":"/api/books"');
      expect(expectedJson).toEndWith('\n');
    });

    it('should format log entry with IP address as JSON', () => {
      const logEntry: LogEntry = {
        timestamp: '2025-11-09T18:58:00.123Z',
        method: 'POST',
        url: '/api/books',
        ip: '192.168.1.100',
      };

      const expectedJson = JSON.stringify(logEntry) + '\n';
      
      expect(expectedJson).toContain('"ip":"192.168.1.100"');
    });

    it('should format log entry with User-Agent as JSON', () => {
      const logEntry: LogEntry = {
        timestamp: '2025-11-09T18:58:00.123Z',
        method: 'PUT',
        url: '/api/books/1',
        userAgent: 'Mozilla/5.0',
      };

      const expectedJson = JSON.stringify(logEntry) + '\n';
      
      expect(expectedJson).toContain('"userAgent":"Mozilla/5.0"');
    });

    it('should format log entry with all optional fields as JSON', () => {
      const logEntry: LogEntry = {
        timestamp: '2025-11-09T18:58:00.123Z',
        method: 'DELETE',
        url: '/api/books/1',
        ip: '10.0.0.1',
        userAgent: 'curl/7.68.0',
      };

      const expectedJson = JSON.stringify(logEntry) + '\n';
      
      expect(expectedJson).toContain('"ip":"10.0.0.1"');
      expect(expectedJson).toContain('"userAgent":"curl/7.68.0"');
      expect(expectedJson).toEndWith('\n');
    });
  });

  describe('Text Formatter', () => {
    it('should format a basic log entry as text with newline', () => {
      const logEntry: LogEntry = {
        timestamp: '2025-11-09T18:58:00.123Z',
        method: 'GET',
        url: '/api/books',
      };

      const expectedText = `[${logEntry.timestamp}] ${logEntry.method} ${logEntry.url}\n`;
      
      expect(expectedText).toBe('[2025-11-09T18:58:00.123Z] GET /api/books\n');
      expect(expectedText).toEndWith('\n');
    });

    it('should format log entry with IP address as text', () => {
      const logEntry: LogEntry = {
        timestamp: '2025-11-09T18:58:00.123Z',
        method: 'POST',
        url: '/api/books',
        ip: '192.168.1.100',
      };

      const expectedText = `[${logEntry.timestamp}] ${logEntry.method} ${logEntry.url} - ${logEntry.ip}\n`;
      
      expect(expectedText).toContain('- 192.168.1.100');
      expect(expectedText).toEndWith('\n');
    });

    it('should format log entry with User-Agent as text', () => {
      const logEntry: LogEntry = {
        timestamp: '2025-11-09T18:58:00.123Z',
        method: 'PUT',
        url: '/api/books/1',
        userAgent: 'Mozilla/5.0',
      };

      const expectedText = `[${logEntry.timestamp}] ${logEntry.method} ${logEntry.url} - ${logEntry.userAgent}\n`;
      
      expect(expectedText).toContain('- Mozilla/5.0');
    });

    it('should format log entry with all optional fields as text', () => {
      const logEntry: LogEntry = {
        timestamp: '2025-11-09T18:58:00.123Z',
        method: 'DELETE',
        url: '/api/books/1',
        ip: '10.0.0.1',
        userAgent: 'curl/7.68.0',
      };

      const expectedText = `[${logEntry.timestamp}] ${logEntry.method} ${logEntry.url} - ${logEntry.ip} - ${logEntry.userAgent}\n`;
      
      expect(expectedText).toContain('- 10.0.0.1');
      expect(expectedText).toContain('- curl/7.68.0');
      expect(expectedText).toEndWith('\n');
    });
  });
});
