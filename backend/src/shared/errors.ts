import type { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    response.status(error.status).json({ code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) });
    return;
  }
  console.error("Unhandled API error", error instanceof Error ? error.message : "unknown");
  response.status(500).json({ code: "INTERNAL_ERROR", message: "Ocurrió un error interno." });
}

export function asyncRoute<T extends Request>(handler: (request: T, response: Response) => Promise<void>) {
  return (request: T, response: Response, next: NextFunction) => {
    handler(request, response).catch(next);
  };
}
