import {
  AuthenticationRequest,
  AuthenticationResponse,
} from "../models/api_types";
import UserController from "./db/user.controller";
import { User } from "../models/user";
import { logger } from "../utils/logger";
import { add } from "winston";

const { createHash, timingSafeEqual, randomBytes, pbkdf2 } = require("crypto");
const { Database } = require("./database.service");
const jwt = require("jsonwebtoken");
const config = require("../config/index");
const accessTokenSecret: string = config.ACCESS_TOKEN_SECRET;
const keylen = 128;
const iterations = 10000;


export class LoginService {
  // TODO: User controller is null! Meh
  private userController: UserController = Database.users;

  private getHash(salt: string, iterations: number, input: string): string {
    var hash = pbkdf2(input, salt, iterations, keylen).toString("base64");
    return hash;
  }

  private produceHash(input: string): string {
    var salt = randomBytes(128).toString("base64");
    var hash = pbkdf2(input, salt, iterations, keylen).toString("base64");
    return `${salt}:${iterations}:${hash}`;
  }

  public login(auth: AuthenticationRequest): AuthenticationResponse | null {
    const user: User | null = this.userController.getByUsername(auth.username);
    if (user) {
      const [salt, iterations, hash] = user.password.split(":");
      const hash_pass: string = this.getHash(
        salt,
        parseInt(iterations),
        auth.password
      );
      // TODO: Check what this one expects
      if (timingSafeEqual(hash_pass, hash)) {
        // TODO: Could put expires in. That needs a refresh token possibility.
        const accessToken = jwt.sign(
          { username: user.username },
          accessTokenSecret
        );
        logger.info(`User ${user.username} successfully logged in`);
        return { token: accessToken };
      }
    }
    return null;
  }

  public signup(auth: AuthenticationRequest): AuthenticationResponse | null {
    logger.info(this.userController);
    const user: User | null = this.userController.getByUsername(auth?.username);

    if (!user && auth.username && auth.password) {
      const hashed_pass: string = this.produceHash(auth.password);
      const addedUser: User = this.userController.save(
        auth.username,
        auth.password
      );
      const accessToken = jwt.sign(
        { username: addedUser.username },
        accessTokenSecret
      );
      logger.info(`User ${addedUser.username} successfully logged in`);
      return { token: accessToken };
    }
    return null;
  }
}
