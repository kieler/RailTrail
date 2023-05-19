import { Request, Response, Router } from 'express';
import { AuthenticationRequest, AuthenticationResponse } from '../models/api_types';

import { logger } from '../utils/logger';

export class LoginRoute {
    public static path:string = "/login";
    private static instance : LoginRoute;
    private router = Router();

    private constructor() {
        this.router.post('', this.login);
    }

    static get router() {
        if (!LoginRoute.instance) {
            LoginRoute.instance = new LoginRoute();
        }
        return LoginRoute.instance.router;
    }

    private login = async(req: Request, res: Response) => {
        const authData: AuthenticationRequest = req.body;
        // TODO: Add login logic
        const token: AuthenticationResponse = {token: "hi"};
        res.json(token);
    };
    
}