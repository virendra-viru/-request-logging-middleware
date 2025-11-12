/**
 * Middleware Execution Order Verification
 *
 * This script verifies that:
 * 1. The logging middleware is registered early in the middleware chain
 * 2. Logging occurs before route handlers execute
 * 3. next() is called to continue request processing
 */
declare function runVerificationTests(): Promise<void>;
export { runVerificationTests };
//# sourceMappingURL=verify-middleware.d.ts.map