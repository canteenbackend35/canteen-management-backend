import { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware to validate incoming requests against a Zod schema.
 * Supports validating body, query, and params.
 */
export const validate = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a readable message for the UI
        const errorMessage = error.issues
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        
        return next(new ApiError(400, errorMessage, "Validation failed. Please check your input."));
      }
      return next(error);
    }
  };
};
