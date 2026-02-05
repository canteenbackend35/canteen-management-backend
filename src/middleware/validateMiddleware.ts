import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";

/**
 * Middleware to validate incoming requests against a Zod schema.
 * Supports validating body, query, and params.
 */
export const validate = (schema: ZodTypeAny) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    logger.debug(`🔍 Validating ${req.method} ${req.url}:`, JSON.stringify({
      body: req.body,
      params: req.params
    }, null, 2));
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  });
};
