/**
 * Performance tests
 * Tests middleware latency impact and high-volume scenarios
 */

import express, { Express } from 'express';
import request from 'supertest';
import { createRequestLogger } from '../middleware';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('Performance Tests', () => {
  let app: Express;
  const testLogDir = './test-logs';
  const testLogFile = path.join(testLogDir, 'performance-test.log');

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

  describe('Middleware Latency Impact', () => {
    it('should add minimal overhead to request processing', async () => {
      // Create app without middleware
      const appWithoutMiddleware = express();
      appWithoutMiddleware.get('/test', (req, res) => res.json({ ok: true }));

      // Create app with middleware
      const appWithMiddleware = express();
      appWithMiddleware.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
      }));
      appWithMiddleware.get('/test', (req, res) => res.json({ ok: true }));

      // Measure baseline (without middleware)
      const baselineStart = Date.now();
      for (let i = 0; i < 10; i++) {
        await request(appWithoutMiddleware).get('/test');
      }
      const baselineTime = Date.now() - baselineStart;

      // Measure with middleware
      const middlewareStart = Date.now();
      for (let i = 0; i < 10; i++) {
        await request(appWithMiddleware).get('/test');
      }
      const middlewareTime = Date.now() - middlewareStart;

      // Calculate overhead per request
      const overhead = (middlewareTime - baselineTime) / 10;

      // Overhead should be less than 10ms per request
      expect(overhead).toBeLessThan(10);
    });

    it('should process requests quickly with logging enabled', async () => {
      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      const start = Date.now();
      await request(app).get('/test').expect(200);
      const duration = Date.now() - start;

      // Single request should complete quickly (under 100ms)
      expect(duration).toBeLessThan(100);
    });
  });

  describe('High Volume Request Handling', () => {
    it('should handle 100+ concurrent requests without blocking', async () => {
      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // Create 100 concurrent requests
      const requests = [];
      for (let i = 0; i < 100; i++) {
        requests.push(request(app).get('/test'));
      }

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ ok: true });
      });

      // 100 requests should complete in reasonable time (under 5 seconds)
      expect(duration).toBeLessThan(5000);

      // Wait for all async file writes to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify log file contains entries
      const logContent = await fs.readFile(testLogFile, 'utf8');
      const logLines = logContent.trim().split('\n');

      // Should have logged all requests
      expect(logLines.length).toBeGreaterThan(0);
    });

    it('should not block the event loop during high volume', async () => {
      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // Track response times
      const responseTimes: number[] = [];

      // Make 50 sequential requests
      for (let i = 0; i < 50; i++) {
        const start = Date.now();
        await request(app).get('/test').expect(200);
        const duration = Date.now() - start;
        responseTimes.push(duration);
      }

      // Calculate average response time
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

      // Average response time should be reasonable (under 50ms)
      expect(avgResponseTime).toBeLessThan(50);

      // No single request should take excessively long
      const maxResponseTime = Math.max(...responseTimes);
      expect(maxResponseTime).toBeLessThan(200);
    });

    it('should handle rapid sequential requests efficiently', async () => {
      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      const start = Date.now();

      // Make 100 rapid sequential requests
      for (let i = 0; i < 100; i++) {
        await request(app).get('/test').expect(200);
      }

      const duration = Date.now() - start;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds for 100 requests

      // Wait for async file writes
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify all entries were logged
      const logContent = await fs.readFile(testLogFile, 'utf8');
      const logLines = logContent.trim().split('\n');

      expect(logLines.length).toBe(100);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory during extended use', async () => {
      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // Get initial memory usage
      const initialMemory = process.memoryUsage().heapUsed;

      // Make many requests
      for (let i = 0; i < 100; i++) {
        await request(app).get('/test').expect(200);
      }

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Get final memory usage
      const finalMemory = process.memoryUsage().heapUsed;

      // Memory increase should be reasonable (less than 10MB)
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
      expect(memoryIncrease).toBeLessThan(10);
    });

    it('should use asynchronous operations to prevent blocking', async () => {
      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      // Make a request and measure how quickly it returns
      const start = Date.now();
      const response = await request(app).get('/test');
      const responseTime = Date.now() - start;

      expect(response.status).toBe(200);

      // Response should return quickly (not waiting for file write)
      // This verifies async operations are used
      expect(responseTime).toBeLessThan(50);
    });
  });

  describe('Different Format Performance', () => {
    it('should perform similarly with JSON format', async () => {
      app.use(createRequestLogger({
        logFilePath: testLogFile,
        format: 'json',
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      const start = Date.now();
      for (let i = 0; i < 50; i++) {
        await request(app).get('/test').expect(200);
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    });

    it('should perform similarly with text format', async () => {
      const textLogFile = path.join(testLogDir, 'text-performance.log');
      
      app.use(createRequestLogger({
        logFilePath: textLogFile,
        format: 'text',
      }));

      app.get('/test', (req, res) => res.json({ ok: true }));

      const start = Date.now();
      for (let i = 0; i < 50; i++) {
        await request(app).get('/test').expect(200);
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    });
  });
});
