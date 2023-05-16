import { config } from './config';
import { Server } from "./server";

export const app = new Server().app;
export const server = app.listen(config.SERVER_PORT);