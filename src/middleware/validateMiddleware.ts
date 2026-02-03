import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Middleware to validate incoming requests against a Zod schema.
 * Supports validating body, query, and params.
 */
export const validate = (schema: ZodTypeAny) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  });
};
