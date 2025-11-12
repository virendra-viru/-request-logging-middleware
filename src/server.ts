/**
 * Server Entry Point
 * 
 * Starts the Express application and listens on the configured port
 */

import app from './app';

const PORT = process.env.PORT || 3000;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Request logging is enabled - logs will be written to ./logs/requests.log`);
  console.log(`\nTry these endpoints:`);
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/api/books`);
  console.log(`  POST http://localhost:${PORT}/api/books`);
  console.log(`  PUT  http://localhost:${PORT}/api/books/1`);
  console.log(`  DELETE http://localhost:${PORT}/api/books/1`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default server;
