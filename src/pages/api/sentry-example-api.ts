import type { NextApiRequest, NextApiResponse } from "next";

class SentryExampleAPIError extends Error {
  constructor(message = "Sentry test API error") {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): void {
  if (process.env.NODE_ENV === "production") {
    res
      .status(404)
      .json({
        ok: false,
        message: "Sentry test route disabled in production.",
      });
    return;
  }
  throw new SentryExampleAPIError(
    "This error is raised on the backend called by the example page.",
  );
}
