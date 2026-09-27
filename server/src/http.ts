import type { NextFunction, Request, RequestHandler, Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Express 4 does not catch rejected promises; this forwards them to errorHandler. */
export function asyncHandler(fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req, res).catch(next);
  };
}

/** Validates untrusted input at the boundary; responds 400 with the first problem found. */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join(".");
    throw new HttpError(400, issue ? `${field ? `${field}: ` : ""}${issue.message}` : "Invalid request");
  }
  return result.data;
}

export const idParams = z.object({ id: z.coerce.number().int().positive() });

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const known: Record<string, [number, string]> = {
      P2002: [409, "A record with those values already exists."],
      P2003: [400, "A referenced record does not exist."],
      P2025: [404, "Record not found."],
    };
    const match = known[err.code];
    if (match) {
      res.status(match[0]).json({ error: match[1] });
      return;
    }
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
