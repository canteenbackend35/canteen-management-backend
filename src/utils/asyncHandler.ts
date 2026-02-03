import { Request, Response, NextFunction } from "express";

/**
 * A wrapper function to catch any errors from asynchronous Express route handlers
 * and pass them to the next middleware (usually the global error handler).
 */
const asyncHandler = (requestHandler: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
