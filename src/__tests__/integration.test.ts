/**
 * Integration tests with Express
 * Tests middleware integration with Express app for various HTTP methods
 */

import express, { Express } from 'express';
import request from 'supertest';
import { createRequestLogger } from '../middleware';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('Express Integration Tests', () => {
  let app: Express;
  const testLogDir = './test-logs';
  const testLogFile = path.join(testLogDir, 'integration-test.log');

  // Clean up test logs before and after tests
  beforeEach(async () => {
    try {
      await fs.rm(testLogDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }

    // Create fresh Express app for each test
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

  describe('HTTP Method Logging', () => {
    beforeEach(() => {
      // Mount middleware
      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
      }));

      // Add test routes
      app.get('/api/books', (req, res) => res.json({ books: [] }));
      app.post('/api/books', (req, res) => res.status(201).json({ id: 1 }));
      app.put('/api/books/:id', (req, res) => res.json({ id: req.params.id }));
      app.delete('/api/books/:id', (req, res) => res.status(204).send());
    });

    it('should log GET requests', async () => {
      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body).toEqual({ books: [] });

      // Wait for async file write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify log file contains the entry
      const logContent = await fs.readFile(testLogFile, 'utf8');
      const logEntry = JSON.parse(logContent.trim());

      expect(logEntry.method).toBe('GET');
      expect(logEntry.url).toBe('/api/books');
      expect(logEntry.timestamp).toBeDefined();
    });

    it('should log POST requests', async () => {
      const response = await request(app)
        .post('/api/books')
        .send({ title: 'Test Book' })
        .expect(201);

      expect(response.body).toEqual({ id: 1 });

      // Wait for async file write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify log file contains the entry
      const logContent = await fs.readFile(testLogFile, 'utf8');
      const logEntry = JSON.parse(logContent.trim());

      expect(logEntry.method).toBe('POST');
      expect(logEntry.url).toBe('/api/books');
      expect(logEntry.timestamp).toBeDefined();
    });

    it('should log PUT requests', async () => {
      const response = await request(app)
        .put('/api/books/123')
        .send({ title: 'Updated Book' })
        .expect(200);

      expect(response.body).toEqual({ id: '123' });

      // Wait for async file write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify log file contains the entry
      const logContent = await fs.readFile(testLogFile, 'utf8');
      const logEntry = JSON.parse(logContent.trim());

      expect(logEntry.method).toBe('PUT');
      expect(logEntry.url).toBe('/api/books/123');
      expect(logEntry.timestamp).toBeDefined();
    });

    it('should log DELETE requests', async () => {
      await request(app)
        .delete('/api/books/456')
        .expect(204);

      // Wait for async file write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify log file contains the entry
      const logContent = await fs.readFile(testLogFile, 'utf8');
      const logEntry = JSON.parse(logContent.trim());

      expect(logEntry.method).toBe('DELETE');
      expect(logEntry.url).toBe('/api/books/456');
      expect(logEntry.timestamp).toBeDefined();
    });
  });

  describe('Log File Verification', () => {
    it('should create log file if it does not exist', async () => {
      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      await request(app).get('/test').expect(200);

      // Wait for async file write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify file exists
      const fileExists = await fs.access(testLogFile).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);
    });

    it('should append multiple log entries to the same file', async () => {
      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
      }));

      app.get('/test1', (req, res) => res.json({ test: 1 }));
      app.get('/test2', (req, res) => res.json({ test: 2 }));
      app.get('/test3', (req, res) => res.json({ test: 3 }));

      // Make multiple requests
      await request(app).get('/test1').expect(200);
      await request(app).get('/test2').expect(200);
      await request(app).get('/test3').expect(200);

      // Wait for async file writes
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify log file contains all entries
      const logContent = await fs.readFile(testLogFile, 'utf8');
      const logLines = logContent.trim().split('\n');

      expect(logLines.length).toBe(3);

      const entry1 = JSON.parse(logLines[0]);
      const entry2 = JSON.parse(logLines[1]);
      const entry3 = JSON.parse(logLines[2]);

      expect(entry1.url).toBe('/test1');
      expect(entry2.url).toBe('/test2');
      expect(entry3.url).toBe('/test3');
    });

    it('should log in text format when configured', async () => {
      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'text',
      }));

      app.get('/api/test', (req, res) => res.json({ ok: true }));

      await request(app).get('/api/test').expect(200);

      // Wait for async file write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify log file contains text format
      const logContent = await fs.readFile(testLogFile, 'utf8');
      
      expect(logContent).toMatch(/\[.*\] GET \/api\/test\n/);
    });

    it('should include IP address when configured', async () => {
      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
        includeIp: true,
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      await request(app).get('/test').expect(200);

      // Wait for async file write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify log file contains IP
      const logContent = await fs.readFile(testLogFile, 'utf8');
      const logEntry = JSON.parse(logContent.trim());

      expect(logEntry.ip).toBeDefined();
    });

    it('should include User-Agent when configured', async () => {
      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
        includeUserAgent: true,
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      await request(app)
        .get('/test')
        .set('User-Agent', 'TestAgent/1.0')
        .expect(200);

      // Wait for async file write
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify log file contains User-Agent
      const logContent = await fs.readFile(testLogFile, 'utf8');
      const logEntry = JSON.parse(logContent.trim());

      expect(logEntry.userAgent).toBe('TestAgent/1.0');
    });
  });
});
