import { Request, Response , Router } from 'express';

import { ExampleRoute } from './example.route';
import { LoginRoute } from './login.route';
import { User } from "../models/user";

//TODO: Perhaps use this as a config var?
const accessTokenSecret:string = "SecretToken";
const jwt = require('jsonwebtoken');

export const authenticateJWT = (req: Request, res: Response, next: any) => {
    const authHeader = req.headers.authorization;
  
    if (authHeader) {
        const token = authHeader.split(' ')[1];
  
        jwt.verify(token, accessTokenSecret, (err: boolean, user: User) => {
            if (err) {
                return res.sendStatus(403);
            }
  
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

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