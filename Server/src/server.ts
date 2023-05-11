import express, { Application, Request, Response } from 'express';

import { ApiRoutes } from './routes';

export class Server {
    public app: Application = express();

    constructor() {
        this.app.use(ApiRoutes.path, ApiRoutes.router);
    }
}