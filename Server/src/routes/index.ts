import { Request, Response, Router } from "express";

import { LoginRoute } from "./login.route";
import { VehicleRoute } from "./vehicles.route";
import { InitRoute } from "./init.route";
import { TrakerRoute } from "./tracker.route";
import * as jwt from "jsonwebtoken";
import { logger } from "../utils/logger";
import bodyParser from "body-parser";
import { randomBytes } from "crypto";
const Validator = require('jsonschema').Validator;

const config = require("../config/index");
export const jsonParser = bodyParser.json();
export const v = new Validator();

//TODO: Perhaps use this as a config var?
export const accessTokenSecret: string = randomBytes(128).toString("base64");

export class ApiRoutes {
  public static path = "/api";
  public static instance: ApiRoutes;
  private router = Router();

  private constructor() {
    this.router.use(LoginRoute.path, LoginRoute.router);
    this.router.use(VehicleRoute.path, VehicleRoute.router);
    this.router.use(InitRoute.path, InitRoute.router);
    this.router.use(TrakerRoute.path, TrakerRoute.router)
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
    } catch (err: any | undefined) {
      logger.info("Error occured during authentication.");
      logger.info(err);
      res.sendStatus(401);
      return;
    }
    next();
  } else {
    res.sendStatus(401);
    return;
  }
};
