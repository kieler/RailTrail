import { config } from './config';
import { Server } from "./server";
import { logger } from './utils/logger';

logger.info('Starting app!');
export const app = new Server().app;
logger.info('Started app successfully')

logger.info('Starting server!');
export const server = app.listen(config.SERVER_PORT);
logger.info('Started server successfully');