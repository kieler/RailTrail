import { Request, Response, Router } from "express";
import {
    AuthenticationRequestWebsite,
    AuthenticationResponseWebsite,
} from "../models/api.website";

import { logger } from "../utils/logger";
import  LoginService from "../services/login.service";
import { jsonParser, v } from ".";
import { AuthenticationRequestSchemaWebsite } from "../models/jsonschemas.website";

/**
 * The router class for the routing of the login dialog with the website.
 */
export class LoginRoute {
    /** The path of this api route. */
    public static path: string = "/login";
    /** The sub router instance. */
    private static instance: LoginRoute;
    /** The base router object. */
    private router = Router();
    /** The service to give the methods to. */
    private service: LoginService = new LoginService();

    /**
	 * The constructor to connect all of the routes with specific functions. 
	 */
    private constructor() {
        this.router.post('/website', jsonParser, this.login);
        // FIXME: This will later be deleted.
        this.router.post("/signup", jsonParser, this.signup);
    }

    /**
	 * Creates an instance if there is none yet.
	 */
    static get router() {
        if (!LoginRoute.instance) {
            LoginRoute.instance = new LoginRoute();
        }
        return LoginRoute.instance.router;
    }

    /**
     * This function handles the login.  
     * @param req The request should contain a requestbody that contains an AuthenticationRequest.
     * @param res An AuthenticationResponse (i.e. an authentication token) if successful
     * @returns Nothing.
     */
    private login = async (req: Request, res: Response) => {
        const authData: AuthenticationRequestWebsite = req.body
        logger.info(`User with username: ${authData?.username} tries logging in.`);
        if (!authData || !v.validate(authData, AuthenticationRequestSchemaWebsite).valid
        ) {
            res.sendStatus(400)
            return
        }

        // Call the corresponding service
        const token: AuthenticationResponseWebsite | undefined =
            await this.service.login(authData)

        if (!token) {
            // Something went wrong. Perhaps wrong username?
            logger.warn(`Login for user with username ${authData.username} was not successful`)
            res.sendStatus(401)
            return
        }
        
        res.json(token)
        return
    }

    /**
     * Temporary method to allow authentication. This can be comprehended as a side entrance into the system 
     * that needs to be deleted later.
     * @param req The AuthenticationRequest.
     * @param res A response for the api.
     * @returns Nothing
     */
    private signup = async (req: Request, res: Response) => {
        const authData: AuthenticationRequestWebsite | undefined = req.body;
        if (!authData //|| !v.validate(authData, AuthenticationRequestSchema).valid
        ) {
            res.sendStatus(400)
            return
        }

        logger.info(
            `User with username: ${authData?.username} tries signing up.`
        );
        const token: AuthenticationResponseWebsite | undefined =
            await this.service.signup(authData);
        if (token) {
            res.json(token);
            return;

        }
        else {
            res.sendStatus(401)
            return
        }
    }


}
