import { Request, Response , Router } from 'express';

import { ExampleRoute } from './example.route';
import { LoginRoute } from './login.route';

export class ApiRoutes {
    public static path = '/api';
    public static instance : ApiRoutes;
    private router = Router();

    private constructor() {
        this.router.use(LoginRoute.path, LoginRoute.router);
    }

    static get router() {
        if (!ApiRoutes.instance) {
            ApiRoutes.instance = new ApiRoutes();
        }
        return ApiRoutes.instance.router;
    }
}