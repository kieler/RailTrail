const winston = require("winston");
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.cli(),
  transports: [new winston.transports.Console()],
});
