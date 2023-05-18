import { Request, Response, Router } from 'express';

import { Example } from '../models/index';

export class ExampleRoute {
    public static path = '/example';
    private static instance : ExampleRoute;
    private router = Router();

    private constructor() {
        this.router.get('/', this.root);
        this.router.get('/v2', this.example);
    }

    static get router() {
        if (!ExampleRoute.instance) {
            ExampleRoute.instance = new ExampleRoute();
        }
        return ExampleRoute.instance.router;
    }

    private root = async (req: Request, res: Response) => {
        res.json({'version' : 1})
    };

    private example = async(req: Request, res: Response) => {
        res.json(new Example(3, 'Test', 'This is an example response.'))
    };
}