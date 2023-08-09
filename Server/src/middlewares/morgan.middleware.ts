import morgan, { StreamOptions } from "morgan";
import { logger } from "../utils/logger";
import { config } from "../config";
import { Request, Response } from "express";

// Use the winston logger
const customStream: StreamOptions = {
    write: (message: string) => {
      logger.http(message);
    },
};

export const morganMiddleware = morgan(
    ":remote-addr :method :url :status :res[content-length] - :response-time ms",
    {
      stream: customStream,
    }
);