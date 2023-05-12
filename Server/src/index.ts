import { Server } from "./server";

export const app = new Server().app;
export const server = app.listen(8080, '0.0.0.0');