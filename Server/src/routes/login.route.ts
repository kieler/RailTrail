import { Request, Response, Router } from 'express';
import { AuthenticationRequest, AuthenticationResponse } from '../models/api_types';

import { logger } from '../utils/logger';
import { LoginService } from '../services/login.service';

export class LoginRoute {
    public static path:string = "/login";
    private static instance : LoginRoute;
    private router = Router();
    private service: LoginService = new LoginService(); 

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
        logger.info(`User with username: ${authData.username} tries logging in.`);
        const token: AuthenticationResponse | null = this.service.login(authData);
        if (token){
            res.json(token);
        } else {
            res.sendStatus(401);
        }
    };
}