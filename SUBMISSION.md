# Request Logging Middleware - Submission Document

## Project Overview
Express middleware for logging HTTP requests with timestamps, methods, URLs, status codes, and response times.

## Live Deployment
**Production URL:** https://request-logging-middleware-production-37c1.up.railway.app

**Test Endpoints:**
- Health Check: https://request-logging-middleware-production-37c1.up.railway.app/health
- Books API: https://request-logging-middleware-production-37c1.up.railway.app/api/books
- Single Book: https://request-logging-middleware-production-37c1.up.railway.app/api/books/1

**GitHub Repository:** https://github.com/virendra-viru/-request-logging-middleware

## Middleware Code

### Core Implementation (`src/middleware/requestLogger.ts`)
```typescript
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

export interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  statusCode?: number;
  responseTime?: number;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  };

  res.on('finish', () => {
    logEntry.statusCode = res.statusCode;
    logEntry.responseTime = Date.now() - startTime;
    
    const logMessage = `[${logEntry.timestamp}] ${logEntry.method} ${logEntry.url} - Status: ${logEntry.statusCode} - ${logEntry.responseTime}ms\n`;
    
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logFile = path.join(logsDir, 'requests.log');
    fs.appendFileSync(logFile, logMessage);
    
    console.log(logMessage.trim());
  });

  next();
}
```

### Server Implementation (`src/server.ts`)
```typescript
import express from 'express';
import { requestLogger } from './middleware/requestLogger';

const app = express();
const PORT = process.env.PORT || 3000;

// Apply logging middleware to all routes
app.use(requestLogger);

// Sample routes for testing
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/books', (req, res) => {
  res.json([
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    { id: 2, title: '1984', author: 'George Orwell' },
    { id: 3, title: 'To Kill a Mockingbird', author: 'Harper Lee' }
  ]);
});

app.get('/api/books/:id', (req, res) => {
  const books = [
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    { id: 2, title: '1984', author: 'George Orwell' },
    { id: 3, title: 'To Kill a Mockingbird', author: 'Harper Lee' }
  ];
  
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (book) {
    res.json(book);
  } else {
    res.status(404).json({ error: 'Book not found' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

## Testing and Verification Results

### 1. Unit Tests (Jest)
**Test File:** `src/__tests__/requestLogger.test.ts`

**Test Coverage:**
- ✅ Middleware logs request method and URL
- ✅ Middleware logs status code after response
- ✅ Middleware logs response time
- ✅ Middleware creates logs directory if it doesn't exist
- ✅ Middleware appends to log file
- ✅ Middleware calls next() to continue request chain

**Test Results:**
```
PASS  src/__tests__/requestLogger.test.ts
  Request Logger Middleware
    ✓ should log request method and URL (15ms)
    ✓ should log status code after response (8ms)
    ✓ should log response time (7ms)
    ✓ should create logs directory if it doesn't exist (6ms)
    ✓ should append to log file (5ms)
    ✓ should call next() (4ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

### 2. Integration Tests
**Test File:** `src/__tests__/server.test.ts`

**Test Coverage:**
- ✅ GET /health returns 200 status
- ✅ GET /api/books returns book list
- ✅ GET /api/books/:id returns specific book
- ✅ GET /api/books/:id returns 404 for invalid ID
- ✅ Undefined routes return 404
- ✅ All requests are logged with middleware

**Test Results:**
```
PASS  src/__tests__/server.test.ts
  Server Integration Tests
    ✓ GET /health should return 200 (25ms)
    ✓ GET /api/books should return book list (12ms)
    ✓ GET /api/books/1 should return specific book (10ms)
    ✓ GET /api/books/999 should return 404 (9ms)
    ✓ Undefined routes should return 404 (8ms)
    ✓ All requests should be logged (11ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

### 3. Production Deployment Tests

**Platform:** Railway (https://railway.app)
**Deployment Status:** ✅ Successful
**Build Time:** ~2 minutes
**Container:** Docker (Node.js 18 Alpine)

**Live Endpoint Tests:**

1. **Health Check Endpoint**
   ```bash
   curl https://request-logging-middleware-production-37c1.up.railway.app/health
   ```
   **Response:**
   ```json
   {"status":"ok","timestamp":"2025-11-13T10:35:42.393Z"}
   ```
   **Status:** ✅ 200 OK

2. **Books API Endpoint**
   ```bash
   curl https://request-logging-middleware-production-37c1.up.railway.app/api/books
   ```
   **Response:**
   ```json
   [
     {"id":1,"title":"The Great Gatsby","author":"F. Scott Fitzgerald"},
     {"id":2,"title":"1984","author":"George Orwell"},
     {"id":3,"title":"To Kill a Mockingbird","author":"Harper Lee"}
   ]
   ```
   **Status:** ✅ 200 OK

3. **Single Book Endpoint**
   ```bash
   curl https://request-logging-middleware-production-37c1.up.railway.app/api/books/1
   ```
   **Response:**
   ```json
   {"id":1,"title":"The Great Gatsby","author":"F. Scott Fitzgerald"}
   ```
   **Status:** ✅ 200 OK

4. **404 Error Handling**
   ```bash
   curl https://request-logging-middleware-production-37c1.up.railway.app/invalid
   ```
   **Response:**
   ```json
   {"error":"Route not found"}
   ```
   **Status:** ✅ 404 Not Found

### 4. Log Output Verification

**Sample Log Entries:**
```
[2025-11-13T10:28:44.534Z] GET /health - Status: 200 - 5ms
[2025-11-13T10:28:45.123Z] GET /api/books - Status: 200 - 8ms
[2025-11-13T10:28:46.789Z] GET /api/books/1 - Status: 200 - 6ms
[2025-11-13T10:28:47.456Z] GET /invalid - Status: 404 - 3ms
```

**Log Format Verification:**
- ✅ ISO 8601 timestamp
- ✅ HTTP method (GET, POST, etc.)
- ✅ Request URL
- ✅ Response status code
- ✅ Response time in milliseconds

## Documentation

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

### Testing
```bash
npm test
```

## Technical Stack
- **Runtime:** Node.js 18
- **Framework:** Express.js 4.18
- **Language:** TypeScript 5.3
- **Testing:** Jest 30.2
- **Deployment:** Railway (Docker)
- **CI/CD:** GitHub + Railway auto-deploy

## Key Features Implemented
1. ✅ Request logging middleware with timestamps
2. ✅ HTTP method and URL logging
3. ✅ Status code tracking
4. ✅ Response time measurement
5. ✅ File-based logging (logs/requests.log)
6. ✅ Console output for real-time monitoring
7. ✅ Automatic log directory creation
8. ✅ TypeScript type safety
9. ✅ Comprehensive test coverage
10. ✅ Production deployment with public URL

## Verification Summary
- **Unit Tests:** 6/6 passed ✅
- **Integration Tests:** 6/6 passed ✅
- **Production Deployment:** Successful ✅
- **Live Endpoints:** All working ✅
- **Logging Functionality:** Verified ✅

## Submission Checklist
- ✅ Middleware code implemented
- ✅ Documentation provided (README.md)
- ✅ Testing completed (12 tests passed)
- ✅ Verification results documented
- ✅ Production deployment successful
- ✅ Public URL accessible
- ✅ GitHub repository available

---

**Submitted by:** Virendra
**Date:** November 13, 2025
**Repository:** https://github.com/virendra-viru/-request-logging-middleware
**Live Demo:** https://request-logging-middleware-production-37c1.up.railway.app/api/books
