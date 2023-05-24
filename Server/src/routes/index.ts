import { Request, Response, Router } from "express";

import { LoginRoute } from "./login.route";
import { VehicleRoute } from "./vehicles.route";
import { InitRoute } from "./init.route";
import * as jwt from "jsonwebtoken";
import { logger } from "../utils/logger";
import bodyParser from "body-parser";
const Validator = require('jsonschema').Validator;

const config = require("../config/index");
export const jsonParser = bodyParser.json();
export const v = new Validator();

//TODO: Perhaps use this as a config var?
const accessTokenSecret: string = config.ACCESS_TOKEN_SECRET || "bla";

export class ApiRoutes {
  public static path = "/api";
  public static instance: ApiRoutes;
  private router = Router();

  private constructor() {
    this.router.use(LoginRoute.path, LoginRoute.router);
    this.router.use(VehicleRoute.path, VehicleRoute.router);
    this.router.use(InitRoute.path, InitRoute.router);
  }

  static get router() {
    if (!ApiRoutes.instance) {
      ApiRoutes.instance = new ApiRoutes();
    }
    return ApiRoutes.instance.router;
  }
}

export const authenticateJWT = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    // Bearer <token>
    const token = authHeader.split(" ")[1];
    try {
      let user: any = jwt.verify(token, accessTokenSecret as string);
      req.params.username = user.username;
    } catch (err) {
      logger.info("Error occured during authentication.");
      res.sendStatus(401);
    }
    next();
  } else {
    res.sendStatus(401);
  }
};
