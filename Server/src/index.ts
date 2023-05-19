import { config } from './config';
import { Server } from "./server";
const winston = require('winston');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.cli(),
    transports: [new winston.transports.Console()],
});

logger.info('Starting app!');
export const app = new Server().app;
logger.info('Started app successfully')

logger.info('Starting server!');
export const server = app.listen(config.SERVER_PORT);
logger.info('Started server successfully');