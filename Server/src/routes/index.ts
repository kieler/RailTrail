import { Request, Response, Router } from "express";

import { LoginRoute } from "./login.route";
import { User } from "../models/user";
import { VehicleRoute } from "./vehicles.route";
const config = require("../config/index");

//TODO: Perhaps use this as a config var?
const accessTokenSecret: string = config.ACCESS_TOKEN_SECRET || "bla";
const jwt = require("jsonwebtoken");

export const authenticateJWT = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    // Bearer <token>
    const token = authHeader.split(" ")[1];

    jwt.verify(token, accessTokenSecret, (err: boolean, user: User) => {
      if (err) {
        return res.sendStatus(403);
      }
      // How can we put the user into the request?
      // req.user = user.username;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

export class ApiRoutes {
  public static path = "/api";
  public static instance: ApiRoutes;
  private router = Router();

  private constructor() {
    this.router.use(LoginRoute.path, LoginRoute.router);
    this.router.use(VehicleRoute.path, VehicleRoute.router);
  }

  static get router() {
    if (!ApiRoutes.instance) {
      ApiRoutes.instance = new ApiRoutes();
    }
    return ApiRoutes.instance.router;
  }
}
