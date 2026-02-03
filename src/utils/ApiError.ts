/**
 * Custom Error class to handle API-specific errors with status codes and messages.
 */
class ApiError extends Error {
  statusCode: number;
  success: boolean;
  UImessage: string;

  constructor(statusCode: number, message: string, UImessage?: string) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.UImessage = UImessage || message;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export { ApiError };
