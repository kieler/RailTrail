import { Request, Response , Router } from 'express';

export class ApiRoutes {
    public static path = '/api';
    public static instance : ApiRoutes;
    private router = Router();

    private constructor() {
        this.router.get('/', this.get);
    }

    static get router() {
        if (!ApiRoutes.instance) {
            ApiRoutes.instance = new ApiRoutes();
        }
        return ApiRoutes.instance.router;
    }

    private get = async (req : Request, res: Response) => {
        res.status(200).send({'value' : 'Hello World'});
    };
}