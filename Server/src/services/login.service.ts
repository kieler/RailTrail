import {
  AuthenticationRequest,
  AuthenticationResponse,
} from "../models/api_types";
import UserController from "./db/user.controller";
import { User } from "../models/user";
import { logger } from "../utils/logger";

import * as jwt from "jsonwebtoken";
import * as argon from "argon2";

const { Database } = require("./database.service");
const config = require("../config/index");

const accessTokenSecret: string = config.ACCESS_TOKEN_SECRET || "bla";
const keylen = 128;
const iterations = 10000;

export class LoginService {
  // TODO: User controller is null! Meh
  private userController: UserController = new Database().users;

  private async produceHash(input: string): Promise<string | undefined> {
    try {
      return argon.hash(input);
    } catch (err) {
      return;
    }
  }

  public async login(
    auth: AuthenticationRequest
  ): Promise<AuthenticationResponse | undefined> {
    const user: User | null = this.userController.getByUsername(auth.username);
    if (user) {
      const password = user.password;
      let isCorrectPassword: boolean;
      try {
        isCorrectPassword = await argon.verify(password, auth.password);
      } catch (err) {
        isCorrectPassword = false;
      }
      if (isCorrectPassword) {
        // TODO: Could put expires in. That needs a refresh token possibility.
        const accessToken = jwt.sign(
          { username: user.username },
          accessTokenSecret
        );
        logger.info(`User ${user.username} successfully logged in`);
        return { token: accessToken };
      }
    }
    return;
  }

  /**
   * Sign up process. This should only possible for testing and adding users.
   * @param auth The authentication information from the request
   * @returns An AuthenticationResponse with a session token or undefined, if something went wrong.
   */
  public async signup(
    auth: AuthenticationRequest
  ): Promise<AuthenticationResponse | undefined> {
    // TODO: Check if works when real implementation is there.
    const user: User | null = this.userController.getByUsername(auth?.username);

    if (!user && auth.username && auth.password) {
      logger.info("Hashing password!");
      const hashed_pass: string | undefined = await this.produceHash(
        auth.password
      );
      if (hashed_pass) {
        // TODO: Check if this works when real implementation is there.
        const addedUser: User = this.userController.save(
          auth.username,
          hashed_pass
        );
        const accessToken = jwt.sign(
          { username: auth.username },
          accessTokenSecret
        );
        logger.info(`User ${auth.username} successfully signed in`);
        return { token: accessToken };
      }
    }
    return undefined;
  }
}
