/**
 * Example Express Application with Request Logging Middleware
 * 
 * This file demonstrates how to integrate the request logging middleware
 * into an Express application for a book management API.
 */

import express, { Request, Response } from 'express';
import { createRequestLogger } from './middleware';

// Create Express application instance
const app = express();

// Configure middleware to parse JSON request bodies
app.use(express.json());

// ============================================================================
// MIDDLEWARE INTEGRATION - Task 6.1
// ============================================================================

/**
 * Mount the request logging middleware BEFORE route handlers
 * This ensures all incoming requests are logged before processing
 * 
 * Configuration options:
 * - format: 'json' for structured logging (default)
 * - logFilePath: Path to the log file
 * - includeIp: Include client IP addresses in logs
 */
app.use(createRequestLogger({
  format: 'json',
  logFilePath: './logs/requests.log',
  includeIp: true,
  includeUserAgent: false,
  enabled: true
}));

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Get all books
 */
app.get('/api/books', (req: Request, res: Response) => {
  // Mock book data
  const books = [
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    { id: 2, title: '1984', author: 'George Orwell' },
    { id: 3, title: 'To Kill a Mockingbird', author: 'Harper Lee' }
  ];
  res.json(books);
});

/**
 * Get a specific book by ID
 */
app.get('/api/books/:id', (req: Request, res: Response) => {
  const bookId = parseInt(req.params.id);
  
  // Mock book lookup
  const book = { id: bookId, title: 'Sample Book', author: 'Sample Author' };
  res.json(book);
});

/**
 * Create a new book
 */
app.post('/api/books', (req: Request, res: Response) => {
  const { title, author } = req.body;
  
  // Mock book creation
  const newBook = {
    id: Date.now(),
    title,
    author,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json(newBook);
});

/**
 * Update an existing book
 */
app.put('/api/books/:id', (req: Request, res: Response) => {
  const bookId = parseInt(req.params.id);
  const { title, author } = req.body;
  
  // Mock book update
  const updatedBook = {
    id: bookId,
    title,
    author,
    updatedAt: new Date().toISOString()
  };
  
  res.json(updatedBook);
});

/**
 * Delete a book
 */
app.delete('/api/books/:id', (req: Request, res: Response) => {
  const bookId = parseInt(req.params.id);
  
  res.json({ message: `Book ${bookId} deleted successfully` });
});

/**
 * 404 handler for undefined routes
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export the configured Express app
export default app;
