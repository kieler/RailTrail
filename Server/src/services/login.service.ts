import {
  AuthenticationRequest,
  AuthenticationResponse,
} from "../models/api_types";
import UserController from "./db/user.controller";
import { User } from "../models/user";
import { logger } from "../utils/logger";

const { createHash, timingSafeEqual, randomBytes,pbkdf2 } = require("crypto");
const { Database } = require("./database.service");
const  jwt = require("jsonwebtoken");
const accessTokenSecret: string = "SecretToken";

export class LoginService {
  private userController: UserController = Database.users;

  private getHash(salt: string, iterations: number, input: string): string {

    //var salt = randomBytes(128).toString('hex');
    //var iterations = 10000;
    var hash = pbkdf2(input, salt, iterations).toString('hex');

   
   
   return hash;
  }

  private produceHash(input:string): string {
    var salt = randomBytes(128).toString('hex');
    var iterations = 10000;
    var hash = pbkdf2(input, salt, iterations).toString('hex');
    return `${salt}:${iterations}:${hash}`;
  }

  public login(auth: AuthenticationRequest): AuthenticationResponse | null {
    const user: User | null = this.userController.getByUsername(auth.username);
    if (user) {
      const [salt, iterations, hash] = user.password.split(':');
      const hash_pass: string = this.getHash(salt, parseInt(iterations), auth.password);
      // TODO: Check what this one expects
      if (timingSafeEqual(hash_pass, hash)) {

        // TODO: Could put expires in. That needs a refres token possibility.
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
}
