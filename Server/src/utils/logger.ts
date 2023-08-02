import winston from "winston";
import { config } from "../config/index";

const format = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

export const logger = winston.createLogger({
  format: format,
  transports: [
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error"}),
    new winston.transports.File({
      filename: "logs/all.log",
      level: "silly"})]
});

if(config.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    level: "silly"
  }))
};
