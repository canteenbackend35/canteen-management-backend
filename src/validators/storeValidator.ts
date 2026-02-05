import { z } from "zod";
import { storeIdParam } from "./common.js";

/**
 * Schema for basic store ID operations
 */
export const storeIdSchema = z.object({
  params: storeIdParam,
});

/**
 * Schema for updating store status
 */
export const updateStoreStatusSchema = z.object({
  body: z.object({
    status: z.string().refine((val) => val === "open" || val === "closed", {
      message: "Status must be either open or closed",
    }),
  }),
});
