import express, { Application, Request, Response } from 'express';

import { ApiRoutes } from './routes';
import { Database } from './services/database.service';
import { SchemaService } from './services/jsonschema/schema.service';

/**
 * Server class
 * 
 * This class represents the general server written with express and
 * initializes the database and the routes in a structured manner.
 */
export class Server {
    public app: Application = express();
    private db : Database = new Database();
    private schemaservice: SchemaService = new SchemaService()

    constructor() {
        this.schemaservice.execute()
        this.app.use(ApiRoutes.path, ApiRoutes.router);
    }
}