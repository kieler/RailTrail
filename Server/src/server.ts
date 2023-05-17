import express, { Application, Request, Response } from 'express';

import { ApiRoutes } from './routes';
import { Database } from './services/database.service';

export class Server {
    public app: Application = express();
    private db : Database = new Database();

    constructor() {
        this.app.use(ApiRoutes.path, ApiRoutes.router);
    }
}