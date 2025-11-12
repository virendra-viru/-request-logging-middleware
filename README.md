# Request Logging Middleware

Express middleware for logging HTTP requests to a file with configurable format and options.

## Purpose

This middleware automatically captures and logs essential information about every incoming HTTP request to your Express application. It's designed for debugging, monitoring, and auditing purposes, helping developers track application usage and troubleshoot issues.

## Features

- Logs all incoming HTTP requests (GET, POST, PUT, DELETE, etc.)
- Configurable log format (JSON or text)
- Asynchronous file operations (non-blocking, < 10ms overhead)
- Graceful error handling (logging failures never crash the application)
- Optional IP address and User-Agent logging
- TypeScript support with full type definitions
- Automatic log directory creation
- Production-ready with high-volume support (100+ requests/second)

## Installation

This middleware is part of the application. No separate installation is required.

If you're integrating this into a new project, ensure you have the required dependencies:

```bash
npm install express
npm install --save-dev @types/express @types/node typescript
```

## Usage

### Basic Integration

Import and mount the middleware in your Express application:

```typescript
import express from 'express';
import { createRequestLogger } from './middleware';

const app = express();

// Mount the logging middleware BEFORE route handlers
app.use(createRequestLogger());

// Your route handlers
app.get('/api/books', (req, res) => {
  res.json({ books: [] });
});

app.listen(3000);
```

### With Custom Configuration

```typescript
import express from 'express';
import { createRequestLogger } from './middleware';

const app = express();

// Configure the middleware with custom options
app.use(createRequestLogger({
  logFilePath: './logs/app-requests.log',
  format: 'text',
  includeIp: true,
  includeUserAgent: true,
  enabled: true
}));

app.listen(3000);
```

### Environment-Specific Configuration

```typescript
import express from 'express';
import { createRequestLogger } from './middleware';

const app = express();

// Different configuration for development vs production
const logConfig = process.env.NODE_ENV === 'production'
  ? {
      logFilePath: '/var/log/myapp/requests.log',
      format: 'json' as const,
      includeIp: true,
      includeUserAgent: false
    }
  : {
      logFilePath: './logs/requests.log',
      format: 'text' as const,
      includeIp: true,
      includeUserAgent: true
    };

app.use(createRequestLogger(logConfig));

app.listen(3000);
```

## Configuration Options

The `createRequestLogger` function accepts an optional configuration object with the following properties:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `logFilePath` | `string` | `'./logs/requests.log'` | Path to the log file where requests will be written. Directory will be created automatically if it doesn't exist. |
| `format` | `'json' \| 'text'` | `'json'` | Format for log entries. Use `'json'` for structured, machine-readable logs or `'text'` for human-readable format. |
| `enabled` | `boolean` | `true` | Enable or disable logging. Set to `false` to temporarily disable without removing the middleware. |
| `includeIp` | `boolean` | `false` | Include client IP address in log entries. Attempts to extract real IP from `X-Forwarded-For` header (for proxied requests) or falls back to socket IP. |
| `includeUserAgent` | `boolean` | `false` | Include the User-Agent header in log entries to track client browsers/applications. |

### Configuration Examples

**Minimal configuration (uses all defaults):**
```typescript
app.use(createRequestLogger());
```

**JSON format with IP logging:**
```typescript
app.use(createRequestLogger({
  format: 'json',
  includeIp: true
}));
```

**Text format with full details:**
```typescript
app.use(createRequestLogger({
  format: 'text',
  includeIp: true,
  includeUserAgent: true
}));
```

**Custom log file location:**
```typescript
app.use(createRequestLogger({
  logFilePath: '/var/log/myapp/requests.log'
}));
```

**Disable logging temporarily:**
```typescript
app.use(createRequestLogger({
  enabled: false
}));
```

## Log File Format and Location

### Default Log File Location

By default, logs are written to:
```
./logs/requests.log
```

This path is relative to your application's working directory (where you run `npm start` or `node`).

### Log File Structure

The log file contains one entry per line, with each line representing a single HTTP request. The format depends on your configuration.

### JSON Format (default)

Each line is a valid JSON object with the following structure:

**Minimal (default configuration):**
```json
{"timestamp":"2025-11-10T17:19:12.964Z","method":"GET","url":"/api/books"}
```

**With IP address (`includeIp: true`):**
```json
{"timestamp":"2025-11-10T17:19:12.964Z","method":"GET","url":"/api/books","ip":"192.168.1.100"}
```

**With IP and User-Agent (`includeIp: true`, `includeUserAgent: true`):**
```json
{"timestamp":"2025-11-10T17:19:12.964Z","method":"POST","url":"/api/books","ip":"192.168.1.100","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
```

**Field Descriptions:**
- `timestamp`: ISO 8601 formatted date-time string (UTC timezone)
- `method`: HTTP method (GET, POST, PUT, DELETE, PATCH, etc.)
- `url`: Full request URL including path and query parameters
- `ip`: Client IP address (optional, extracted from X-Forwarded-For header or socket)
- `userAgent`: User-Agent header from the request (optional)

### Text Format

Human-readable format with the following structure:

**Minimal (default configuration):**
```
[2025-11-10T17:19:12.964Z] GET /api/books
```

**With IP address (`includeIp: true`):**
```
[2025-11-10T17:19:12.964Z] GET /api/books - 192.168.1.100
```

**With IP and User-Agent (`includeIp: true`, `includeUserAgent: true`):**
```
[2025-11-10T17:19:12.964Z] POST /api/books - 192.168.1.100 - Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
```

### Accessing and Reading Log Files

**View the entire log file:**
```bash
cat ./logs/requests.log
```

**View the last 50 entries:**
```bash
tail -n 50 ./logs/requests.log
```

**Follow logs in real-time:**
```bash
tail -f ./logs/requests.log
```

**Search for specific requests (JSON format):**
```bash
# Find all POST requests
grep '"method":"POST"' ./logs/requests.log

# Find requests to a specific endpoint
grep '"/api/books"' ./logs/requests.log

# Find requests from a specific IP
grep '"ip":"192.168.1.100"' ./logs/requests.log
```

**Parse JSON logs with jq:**
```bash
# Pretty-print all logs
cat ./logs/requests.log | jq '.'

# Filter POST requests
cat ./logs/requests.log | jq 'select(.method == "POST")'

# Count requests by method
cat ./logs/requests.log | jq -r '.method' | sort | uniq -c
```

### Log Rotation Recommendations for Production

The middleware does not include built-in log rotation. For production deployments, implement log rotation to prevent log files from growing indefinitely:

**Option 1: Using logrotate (Linux/Unix)**

Create a logrotate configuration file at `/etc/logrotate.d/myapp`:

```
/var/log/myapp/requests.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 myapp myapp
    sharedscripts
    postrotate
        # Optional: signal your app to reopen log file if needed
    endscript
}
```

This configuration:
- Rotates logs daily
- Keeps 14 days of logs
- Compresses old logs
- Creates new log file with proper permissions

**Option 2: Using a logging library**

For more advanced log management, consider integrating with a structured logging library:

```bash
npm install winston
# or
npm install pino
```

These libraries provide built-in log rotation, multiple transports, and advanced features.

**Option 3: Using PM2 (Node.js process manager)**

If you're using PM2 to manage your Node.js application:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**Option 4: Cloud-based logging**

For cloud deployments, consider streaming logs to a centralized logging service:
- AWS CloudWatch Logs
- Google Cloud Logging
- Azure Monitor
- Datadog
- Loggly
- Papertrail

### Production Best Practices

1. **Use absolute paths** for log files in production:
   ```typescript
   logFilePath: '/var/log/myapp/requests.log'
   ```

2. **Set appropriate file permissions** to protect log data:
   ```bash
   chmod 640 /var/log/myapp/requests.log
   chown myapp:myapp /var/log/myapp/requests.log
   ```

3. **Monitor disk space** to prevent logs from filling up the disk

4. **Implement log rotation** as described above

5. **Use JSON format** for easier parsing and analysis:
   ```typescript
   format: 'json'
   ```

6. **Consider privacy implications** when logging IP addresses (GDPR compliance)

## Running the Example Application

Start the example Express server:

```bash
npm start
```

The server will start on port 3000 with the following endpoints:

- `GET /health` - Health check endpoint
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get a specific book
- `POST /api/books` - Create a new book
- `PUT /api/books/:id` - Update a book
- `DELETE /api/books/:id` - Delete a book

All requests will be logged to `./logs/requests.log`.

## Verification

Run the middleware verification tests to ensure proper integration:

```bash
npm run verify
```

This will verify:
- Middleware execution order is correct
- Logging occurs before route handlers
- `next()` is called to continue request processing
- Middleware is registered early in the chain

## Middleware Execution Order

The logging middleware should be mounted **early** in the middleware chain, typically:

1. After `express.json()` and `express.urlencoded()` (body parsers)
2. Before any route handlers
3. Before error handling middleware

Example:

```typescript
const app = express();

// 1. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Request logging middleware
app.use(createRequestLogger());

// 3. Route handlers
app.get('/api/books', handler);

// 4. Error handling
app.use(errorHandler);
```

## Error Handling

The middleware handles errors gracefully:

- File system errors are caught and logged to console
- Request processing continues even if logging fails
- Specific error messages for common issues (permissions, disk space, etc.)

## Production Deployment

### Production Configuration Examples

When deploying to production, use these recommended configurations based on your environment:

#### Standard Production Configuration

```typescript
import { createRequestLogger } from './middleware';

app.use(createRequestLogger({
  logFilePath: '/var/log/myapp/requests.log',
  format: 'json',
  includeIp: true,
  includeUserAgent: false,
  enabled: true
}));
```

**Rationale:**
- Absolute path (`/var/log/myapp/`) for predictable log location
- JSON format for structured logging and easy parsing
- IP logging enabled for security auditing
- User-Agent disabled to reduce log size (enable if needed for analytics)

#### Docker Container Configuration

```typescript
app.use(createRequestLogger({
  logFilePath: '/app/logs/requests.log',
  format: 'json',
  includeIp: true,
  includeUserAgent: false
}));
```

**Docker Volume Mount:**
```yaml
# docker-compose.yml
services:
  app:
    volumes:
      - ./logs:/app/logs
```

#### Cloud Environment Configuration (AWS, Azure, GCP)

```typescript
// Use environment variables for configuration
import { createRequestLogger } from './middleware';

app.use(createRequestLogger({
  logFilePath: process.env.LOG_FILE_PATH || '/var/log/app/requests.log',
  format: 'json',
  includeIp: true,
  includeUserAgent: false
}));
```

**Cloud-Specific Recommendations:**
- AWS: Use CloudWatch Logs for centralized logging
- Azure: Use Azure Monitor and Application Insights
- GCP: Use Cloud Logging (formerly Stackdriver)
- Consider using stdout/stderr and let the platform capture logs

#### Kubernetes Configuration

```typescript
app.use(createRequestLogger({
  logFilePath: '/var/log/app/requests.log',
  format: 'json',
  includeIp: true,
  includeUserAgent: false
}));
```

**Kubernetes ConfigMap:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_FILE_PATH: "/var/log/app/requests.log"
  LOG_FORMAT: "json"
```

**Kubernetes Volume Mount:**
```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: app
    volumeMounts:
    - name: logs
      mountPath: /var/log/app
  volumes:
  - name: logs
    emptyDir: {}
```

### Security Best Practices

#### File Permissions

Set restrictive permissions on log files to prevent unauthorized access:

```bash
# Create log directory with proper ownership
sudo mkdir -p /var/log/myapp
sudo chown myapp:myapp /var/log/myapp
sudo chmod 750 /var/log/myapp

# Set permissions on log file
sudo chmod 640 /var/log/myapp/requests.log
sudo chown myapp:myapp /var/log/myapp/requests.log
```

**Permission Breakdown:**
- `750` for directory: Owner can read/write/execute, group can read/execute, others have no access
- `640` for log file: Owner can read/write, group can read, others have no access

#### Sensitive Data Protection

**DO NOT log sensitive information:**
- Passwords or authentication tokens
- Credit card numbers or payment information
- Social Security numbers or national IDs
- Personal health information (PHI)
- API keys or secrets
- Session tokens or cookies

**Example - Sanitizing URLs:**
```typescript
// If you need to sanitize URLs before logging
import { createRequestLogger } from './middleware';

// Custom implementation to sanitize sensitive query parameters
function sanitizeUrl(url: string): string {
  const urlObj = new URL(url, 'http://dummy.com');
  const sensitiveParams = ['token', 'apiKey', 'password', 'secret'];
  
  sensitiveParams.forEach(param => {
    if (urlObj.searchParams.has(param)) {
      urlObj.searchParams.set(param, '[REDACTED]');
    }
  });
  
  return urlObj.pathname + urlObj.search;
}
```

#### IP Address Logging and Privacy (GDPR)

When logging IP addresses, consider privacy regulations:

**GDPR Compliance:**
- IP addresses are considered Personal Identifiable Information (PII)
- Obtain user consent or have legitimate interest for logging
- Implement data retention policies
- Provide mechanisms for data deletion requests
- Document your legal basis for processing

**Recommendations:**
- Only enable `includeIp: true` if required for security or debugging
- Implement log retention policies (e.g., delete logs after 30-90 days)
- Consider IP anonymization for analytics purposes
- Document your data processing in privacy policy

**IP Anonymization Example:**
```typescript
// Anonymize last octet of IPv4 addresses
function anonymizeIp(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    parts[3] = '0';
    return parts.join('.');
  }
  return ip; // Return as-is for IPv6 or invalid IPs
}
```

#### Log File Encryption

For highly sensitive environments, consider encrypting log files:

```bash
# Encrypt logs at rest using GPG
gpg --symmetric --cipher-algo AES256 /var/log/myapp/requests.log

# Or use filesystem-level encryption (LUKS, dm-crypt)
```

#### Network Security

If transmitting logs over the network:
- Use TLS/SSL for log shipping
- Authenticate log receivers
- Use VPN or private networks for log transmission

### Environment-Specific Configuration

Use environment variables to manage configuration across environments:

```typescript
import { createRequestLogger, LoggerConfig } from './middleware';

const config: LoggerConfig = {
  logFilePath: process.env.LOG_FILE_PATH || './logs/requests.log',
  format: (process.env.LOG_FORMAT as 'json' | 'text') || 'json',
  includeIp: process.env.LOG_INCLUDE_IP === 'true',
  includeUserAgent: process.env.LOG_INCLUDE_USER_AGENT === 'true',
  enabled: process.env.LOG_ENABLED !== 'false'
};

app.use(createRequestLogger(config));
```

**Environment Variables:**
```bash
# .env.production
LOG_FILE_PATH=/var/log/myapp/requests.log
LOG_FORMAT=json
LOG_INCLUDE_IP=true
LOG_INCLUDE_USER_AGENT=false
LOG_ENABLED=true

# .env.development
LOG_FILE_PATH=./logs/requests.log
LOG_FORMAT=text
LOG_INCLUDE_IP=true
LOG_INCLUDE_USER_AGENT=true
LOG_ENABLED=true

# .env.test
LOG_FILE_PATH=./logs/test-requests.log
LOG_FORMAT=json
LOG_INCLUDE_IP=false
LOG_INCLUDE_USER_AGENT=false
LOG_ENABLED=false
```

### Deployment Checklist

Use this checklist before deploying the logging middleware to production:

#### Pre-Deployment Verification

- [ ] **Configuration Review**
  - [ ] Log file path is set to production location (e.g., `/var/log/myapp/requests.log`)
  - [ ] Log format is set to `json` for structured logging
  - [ ] IP logging is configured based on privacy requirements
  - [ ] User-Agent logging is configured based on requirements
  - [ ] Environment variables are properly set

- [ ] **File System Setup**
  - [ ] Log directory exists and is writable by application user
  - [ ] Log directory has correct permissions (750 or 755)
  - [ ] Log file has correct permissions (640 or 644)
  - [ ] Sufficient disk space available (monitor with alerts)
  - [ ] Log rotation is configured (logrotate, PM2, or cloud service)

- [ ] **Security Review**
  - [ ] Log files have restrictive permissions
  - [ ] No sensitive data is being logged (passwords, tokens, PII)
  - [ ] GDPR compliance reviewed if logging IP addresses
  - [ ] Data retention policy is documented and implemented
  - [ ] Log access is restricted to authorized personnel only

- [ ] **Testing**
  - [ ] All unit tests pass (`npm test`)
  - [ ] Integration tests pass with production-like configuration
  - [ ] Performance tests show acceptable overhead (< 10ms)
  - [ ] Error handling tested (file permission errors, disk full)
  - [ ] Middleware execution order verified (`npm run verify`)

- [ ] **Monitoring Setup**
  - [ ] Disk space monitoring configured with alerts
  - [ ] Log file size monitoring configured
  - [ ] Error rate monitoring for logging failures
  - [ ] Application performance monitoring (APM) configured
  - [ ] Log aggregation service configured (if applicable)

#### Post-Deployment Verification

- [ ] **Functional Verification**
  - [ ] Log file is being created and written to
  - [ ] Log entries contain expected fields
  - [ ] Log format matches configuration
  - [ ] Timestamps are in correct timezone (UTC)
  - [ ] All HTTP methods are being logged correctly

- [ ] **Performance Verification**
  - [ ] Application response times are within acceptable range
  - [ ] No blocking or delays observed
  - [ ] Memory usage is stable (no leaks)
  - [ ] CPU usage is acceptable

- [ ] **Error Handling Verification**
  - [ ] Application continues running if logging fails
  - [ ] Errors are logged to console for debugging
  - [ ] No unhandled exceptions from middleware

- [ ] **Operational Verification**
  - [ ] Log rotation is working correctly
  - [ ] Old logs are being archived or deleted
  - [ ] Disk space is not filling up
  - [ ] Logs are accessible to operations team
  - [ ] Log analysis tools are working (if applicable)

### Monitoring Recommendations

#### Disk Space Monitoring

Set up alerts for disk space usage:

```bash
# Example: Alert when disk usage exceeds 80%
df -h /var/log | awk 'NR==2 {print $5}' | sed 's/%//'
```

**Recommended Thresholds:**
- Warning: 80% disk usage
- Critical: 90% disk usage

#### Log File Size Monitoring

Monitor log file growth:

```bash
# Check log file size
ls -lh /var/log/myapp/requests.log

# Alert if log file exceeds 100MB without rotation
```

#### Application Performance Monitoring

Monitor middleware impact:

```typescript
// Example: Add custom metrics
import { createRequestLogger } from './middleware';

let requestCount = 0;
let loggingErrors = 0;

app.use((req, res, next) => {
  requestCount++;
  next();
});

app.use(createRequestLogger({
  logFilePath: '/var/log/myapp/requests.log',
  format: 'json',
  includeIp: true
}));

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    requestCount,
    loggingErrors,
    uptime: process.uptime()
  });
});
```

#### Log Analysis

Regularly analyze logs for:
- Request volume trends
- Error rates
- Slow endpoints
- Unusual traffic patterns
- Security incidents

**Example Log Analysis Commands:**

```bash
# Count requests by method
cat requests.log | jq -r '.method' | sort | uniq -c

# Find most requested endpoints
cat requests.log | jq -r '.url' | sort | uniq -c | sort -rn | head -10

# Count requests by hour
cat requests.log | jq -r '.timestamp' | cut -d'T' -f2 | cut -d':' -f1 | sort | uniq -c

# Find requests from specific IP
cat requests.log | jq 'select(.ip == "192.168.1.100")'
```

### Troubleshooting Guide

#### Issue: Log file is not being created

**Symptoms:**
- No log file appears after starting the application
- No error messages in console

**Possible Causes & Solutions:**

1. **Directory doesn't exist:**
   ```bash
   # Create the directory
   mkdir -p /var/log/myapp
   ```

2. **Permission denied:**
   ```bash
   # Check directory permissions
   ls -ld /var/log/myapp
   
   # Fix permissions
   sudo chown myapp:myapp /var/log/myapp
   sudo chmod 750 /var/log/myapp
   ```

3. **Middleware not mounted:**
   ```typescript
   // Ensure middleware is registered
   app.use(createRequestLogger());
   ```

4. **Logging disabled:**
   ```typescript
   // Check if enabled is set to false
   app.use(createRequestLogger({ enabled: true }));
   ```

#### Issue: Permission denied errors

**Symptoms:**
- Console shows "EACCES: permission denied" errors
- Log file exists but is not being written to

**Solutions:**

1. **Fix file permissions:**
   ```bash
   sudo chown myapp:myapp /var/log/myapp/requests.log
   sudo chmod 640 /var/log/myapp/requests.log
   ```

2. **Fix directory permissions:**
   ```bash
   sudo chown myapp:myapp /var/log/myapp
   sudo chmod 750 /var/log/myapp
   ```

3. **Run application as correct user:**
   ```bash
   # Check current user
   whoami
   
   # Run as correct user
   sudo -u myapp node dist/server.js
   ```

#### Issue: Disk space full

**Symptoms:**
- Console shows "ENOSPC: no space left on device" errors
- Application continues running but logs are not written

**Solutions:**

1. **Check disk space:**
   ```bash
   df -h /var/log
   ```

2. **Remove old logs:**
   ```bash
   # Remove logs older than 30 days
   find /var/log/myapp -name "*.log" -mtime +30 -delete
   ```

3. **Compress old logs:**
   ```bash
   gzip /var/log/myapp/requests.log.1
   ```

4. **Implement log rotation:**
   - See "Log Rotation Recommendations" section above

#### Issue: High memory usage

**Symptoms:**
- Application memory usage grows over time
- Out of memory errors

**Possible Causes & Solutions:**

1. **Log file handle not closed:**
   - The middleware uses `fs.promises.appendFile` which automatically closes handles
   - This should not be an issue with the current implementation

2. **Too many concurrent writes:**
   ```typescript
   // Monitor write queue if implementing custom buffering
   // Current implementation handles this automatically
   ```

3. **Large log entries:**
   - Disable `includeUserAgent` if not needed
   - Consider filtering or truncating long URLs

#### Issue: Performance degradation

**Symptoms:**
- Slow response times
- High CPU usage
- Request timeouts

**Possible Causes & Solutions:**

1. **Synchronous file operations:**
   - Ensure you're using the async version of the middleware
   - The middleware uses `fs.promises.appendFile` (async)

2. **Disk I/O bottleneck:**
   ```bash
   # Check disk I/O
   iostat -x 1
   
   # Consider using faster storage (SSD)
   # Or reduce logging frequency
   ```

3. **Too many log fields:**
   ```typescript
   // Disable optional fields if not needed
   app.use(createRequestLogger({
     includeIp: false,
     includeUserAgent: false
   }));
   ```

#### Issue: Logs not appearing in real-time

**Symptoms:**
- Logs appear delayed or in batches
- `tail -f` doesn't show new entries immediately

**Possible Causes & Solutions:**

1. **File system buffering:**
   - This is normal behavior for file systems
   - Logs may be buffered for a few seconds

2. **Application buffering:**
   - The middleware writes immediately (no buffering)
   - Check if you've implemented custom buffering

3. **Network file system delays:**
   - If using NFS or network storage, delays are expected
   - Consider using local storage for logs

#### Issue: Incorrect timestamps

**Symptoms:**
- Timestamps are in wrong timezone
- Timestamps don't match server time

**Solutions:**

1. **Timestamps are always in UTC:**
   - This is by design (ISO 8601 format)
   - Convert to local timezone when analyzing logs

2. **Server time is incorrect:**
   ```bash
   # Check server time
   date
   
   # Sync time with NTP
   sudo ntpdate -s time.nist.gov
   ```

#### Issue: Missing log entries

**Symptoms:**
- Some requests are not logged
- Gaps in log file

**Possible Causes & Solutions:**

1. **Middleware not mounted early enough:**
   ```typescript
   // Mount BEFORE route handlers
   app.use(createRequestLogger());
   app.get('/api/books', handler);
   ```

2. **Logging disabled:**
   ```typescript
   // Check enabled flag
   app.use(createRequestLogger({ enabled: true }));
   ```

3. **File write errors:**
   - Check console for error messages
   - Verify disk space and permissions

4. **Application crash:**
   - Check application logs for crashes
   - Implement process monitoring (PM2, systemd)

### Getting Help

If you encounter issues not covered in this guide:

1. **Check console output** for error messages
2. **Review application logs** for additional context
3. **Verify configuration** matches your environment
4. **Test with minimal configuration** to isolate the issue
5. **Check file system permissions** and disk space
6. **Review the test suite** for examples of correct usage

For additional support:
- Review the test files in `src/__tests__/` for usage examples
- Check the middleware source code in `src/middleware/`
- Consult Express.js documentation for middleware concepts
