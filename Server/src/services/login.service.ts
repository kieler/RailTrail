import {AuthenticationRequest, AuthenticationResponse,} from "../models/api.website"
import {User} from "../models"
import {logger} from "../utils/logger"
import * as jwt from "jsonwebtoken"
import * as argon from "argon2"

import {accessTokenSecret} from "../routes"
import database from "./database.service"
import CryptoService from "./crypto.service";

/**
 * A class that manages the users.
 */
export default class LoginService {

    /**
     * Login process for a user that is already in the database.
     * @param auth The authentication details.
     * @returns A jsonwebtoken if login successful, undefined otherwise.
     */
    public async login(
        auth: AuthenticationRequest
    ): Promise<AuthenticationResponse | undefined> {
        const user = await database.users.getByUsername(auth.username)
        if (!user) {
            return
        }

        const password: string = user.password
        try {
            await argon.verify(password, auth.password)
        } catch (err) {
            return
        }

        const accessToken = jwt.sign({username: user.username}, accessTokenSecret)
        logger.info(`User ${user.username} successfully logged in`)
        return {token: accessToken}
    }

    /**
     * Sign up process. This should only be possible for testing and adding users.
     * @param auth The authentication information from the request
     * @returns An AuthenticationResponse with a session token or undefined, if something went wrong.
     */
    public async signup(
        auth: AuthenticationRequest
    ): Promise<AuthenticationResponse | undefined> {
        const user: User | null = await database.users.getByUsername(auth?.username)
        // Might add something such that this is only possible if no user is registered yet

        if (!user || !auth.username || !auth.password) {
            return
        }
        logger.info("Hashing password!")
        const hashed_pass: string | undefined = await CryptoService.produceHash(
            auth.password
        )
        if (!hashed_pass) {
            return
        }
        const createdUser: User | null = await database.users.save(auth.username, hashed_pass)
        if (!createdUser) {
            return
        }

        const accessToken: string = jwt.sign(
            {username: auth.username},
            accessTokenSecret
        )
        logger.info(`User ${auth.username} successfully signed in`)
        return {token: accessToken}
    }
}
