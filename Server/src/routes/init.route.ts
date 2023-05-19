import { Request, Response, Router } from 'express';
const winston = require('express-winston');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.cli(),
    transports: [new winston.transports.Console()],
});

export class InitRoute {
    public static path:string = "/init";
    private static instance : InitRoute;
    private router = Router();

    private constructor() {
        this.router.get('/v2', this.init);
    }

    private init = async(req: Request, res: Response) => {
        res.json({'hello': 'world'})
    };
}