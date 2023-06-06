import { Request, Response, Router } from "express";
import {
  AuthenticationRequest,
  PasswordChange,
  UserList,
} from "../models/api_types";

import { logger } from "../utils/logger";
import { authenticateJWT, jsonParser, v } from ".";
import {
  AuthenticationRequestSchema,
  PasswordChangeSchema,
  UpdateRequestSchema,
} from "../models/jsonschemas";

export class UsersRoute {
  public static path: string = "/users";
  private static instance: UsersRoute;
  private router = Router();

  private constructor() {
    this.router.get("", authenticateJWT, this.getUserList);
    this.router.post("", authenticateJWT, jsonParser, this.addNewUser);
    this.router.put(
      "/:userId",
      authenticateJWT,
      jsonParser,
      this.changePassword
    );
    this.router.delete("/:userId", authenticateJWT, this.deleteUser);
  }

  static get router() {
    if (!UsersRoute.instance) {
      UsersRoute.instance = new UsersRoute();
    }
    return UsersRoute.instance.router;
  }

  private getUserList = async (req: Request, res: Response) => {
    // TODO: Call appropriate service method

    // This should be deleted later on:
    const ret: UserList = { users: [{ id: 1, username: "hallo welt" }] };
    res.json(ret);
    return;
  };

  private addNewUser = async (req: Request, res: Response) => {
    const userData: AuthenticationRequest = req.body;
    if (!userData || v.validate(userData, AuthenticationRequestSchema).valid) {
      res.sendStatus(400);
      return;
    }
    // TODO: Call appropriate service method

    res.sendStatus(200);
    return;
  };

  private changePassword = async (req: Request, res: Response) => {
    const userData: PasswordChange = req.body;
    if (!userData || v.validate(userData, PasswordChangeSchema).valid) {
      res.sendStatus(400);
      return;
    }
    // TODO: Call appropriate service method

    res.sendStatus(200);
    return;
  };

  private deleteUser = async (req: Request, res: Response) => {
    if (!req.params || !req.params.userId) {
      res.sendStatus(400);
      return;
    }
    const userIdToBeDeleted: number = parseInt(req.params?.userId);
    // TODO: Call appropriate service method
  };
}
