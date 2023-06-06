import { Request, Response, Router } from "express";
import {
  AuthenticationRequest,
  AuthenticationResponse,
} from "../models/api_types";

import { logger } from "../utils/logger";
import { LoginService } from "../services/login.service";
import { jsonParser, v } from ".";
import { AuthenticationRequestSchema } from "../models/jsonschemas";

export class LoginRoute {
  public static path: string = "/login";
  private static instance: LoginRoute;
  private router = Router();
  private service: LoginService = new LoginService();

  private constructor() {
    this.router.post("", jsonParser, this.login);
    //FIXME: This will later need to contain authentication middleware
    this.router.post("/signup", jsonParser, this.signup);
  }

  static get router() {
    if (!LoginRoute.instance) {
      LoginRoute.instance = new LoginRoute();
    }
    return LoginRoute.instance.router;
  }

  private login = async (req: Request, res: Response) => {
    const authData: AuthenticationRequest = req.body;
    logger.info(`User with username: ${authData.username} tries logging in.`);
    if (authData) {
      if (v.validate(authData, AuthenticationRequestSchema).valid) {
        const token: AuthenticationResponse | undefined =
          await this.service.login(authData);
        if (token) {
          res.json(token);
        } else {
          res.sendStatus(401);
        }
        return;
      }
    }
    res.sendStatus(400);
    return;
  };

  private signup = async (req: Request, res: Response) => {
    const authData: AuthenticationRequest | undefined = req.body;
    if (authData) {
      if (v.validate(authData, AuthenticationRequestSchema).valid) {
        logger.info(
          `User with username: ${authData?.username} tries signing up.`
        );
        const token: AuthenticationResponse | undefined =
          await this.service.signup(authData);
        if (token) {
          res.json(token);
          return;
        }
      }
    }
    res.sendStatus(400);
    return;
  };
}
