import { config } from './config';
import { Server } from "./server";
import { logger } from './utils/logger';

logger.info('Starting server!');
export const app = new Server().app;
export const server = app.listen(config.SERVER_PORT);
logger.info('Started server successfully');