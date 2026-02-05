import { EventEmitter } from "events";

/**
 * Global event emitter for order-related updates.
 * Used for Server-Sent Events (SSE).
 */
export const orderEvents = new EventEmitter();

// Optional: Increase max listeners if you expect many concurrent status watchers
orderEvents.setMaxListeners(100);
