import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

/**
 * ApiError represents a general API error.
 * Example usage:
 *  ```
 *    return c.json(ApiError("User not found", { userId: id }), 404);
 *  ```
 * This would result in an error with a message and an optional cause object.
 */
export class ApiError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "ApiError";
  }

  /** This method is called by Hono when the error is serialized to JSON. */
  toJSON() {
    return {
      error: {
        message: this.message,
        cause: this.cause,
      },
    };
  }
}

/**
 * ApiException represents API-specific errors.
 * It extends the HTTPException Hono class so it can be used seamlessly in Hono apps.
 * Example usage:
 *  ```
 *    throw new ApiException(404, "User not found", { userId: id });
 *  ```
 * This would result in a 404 response with a JSON body containing the error details.
 */
export class ApiException extends HTTPException {
  constructor(status: ContentfulStatusCode, message: string, cause?: unknown) {
    super(status, { message, cause });
    this.name = "ApiException";
  }

  /** This method is called by Hono to get the Response to send to the client. */
  override getResponse(): Response {
    return new Response(
      JSON.stringify({
        error: {
          message: this.message,
          cause: this.cause,
        },
      }),
      {
        status: this.status,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
