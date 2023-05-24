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
import { accessTokenSecret } from "../routes";

/**
 * A class that manages the users.
 */
export class LoginService {
  // TODO: User controller is null! Meh
  private userController: UserController = new Database().users;

  /**
   * Produces a hash using the argon hashing.
   * @param input The password, that needs to be hashed
   * @returns Undefined, if the hashing is unsuccessful, a hash of the password otherwise.
   */
  private async produceHash(input: string): Promise<string | undefined> {
    try {
      return argon.hash(input);
    } catch (err) {
      return;
    }
  }

  /**
   * Login process for a user that is already in the database.
   * @param auth The authentication details. 
   * @returns A jsonwebtoken if login successful, undefined otherwise.
   */
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
   * Sign up process. This should only be possible for testing and adding users.
   * @param auth The authentication information from the request
   * @returns An AuthenticationResponse with a session token or undefined, if something went wrong.
   */
  public async signup(
    auth: AuthenticationRequest
  ): Promise<AuthenticationResponse | undefined> {
    // TODO: Check if works when real implementation is there.
    const user: User | null = this.userController.getByUsername(auth?.username);
    // Might add something such that this is only possible if no user is registered yet

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
