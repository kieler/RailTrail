import { Request, Response, Router } from "express"
import {
    AuthenticationRequestWebsite,
    PasswordChangeWebsite,
    UserListWebsite,
    UserWebsite
} from "../models/api.website"

import { authenticateJWT, jsonParser, v, validateSchema } from "."
import {
    AuthenticationRequestSchemaWebsite,
    PasswordChangeSchemaWebsite
} from "../models/jsonschemas.website"
import UserService from "../services/user.service"
import { User } from "../models"
import { logger } from "../utils/logger"

export class UsersRoute {
    public static path: string = "/users"
    private static instance: UsersRoute
    private router = Router()

    private constructor() {
        this.router.get("/website", authenticateJWT, this.getUserList)
        this.router.post(
            "/website",
            authenticateJWT,
            jsonParser,
            this.addNewUser
        )
        this.router.post(
            "/website/password",
            authenticateJWT,
            jsonParser,
            this.changePassword
        )
        this.router.delete("/website/:userId", authenticateJWT, this.deleteUser)
    }

    static get router() {
        if (!UsersRoute.instance) {
            UsersRoute.instance = new UsersRoute()
        }
        return UsersRoute.instance.router
    }

    /**
     * Get a full list of users with their uid, username and password.
     * @param req
     * @param res A response containing a list of ``User``.
     * @returns Nothing
     */
    private async getUserList(req: Request, res: Response): Promise<void> {
        logger.info(`Getting the user list`)
        res.json(
            (await UserService.getAllUsers())?.map(user => {
                const converted: UserWebsite = {
                    id: user.uid,
                    username: user.username
                }
                return converted
            })
        )
        return
    }

    /**
     * Add a user with a certain username and initial password.
     * @param req A request containing a ``AuthenticationRequestWebsite``.
     * @param res
     * @returns Nothing
     */
    private async addNewUser(req: Request, res: Response): Promise<void> {
        const userData: AuthenticationRequestWebsite = req.body
        if (!validateSchema(userData, AuthenticationRequestSchemaWebsite)) {
            res.sendStatus(400)
            return
        }

        const ret: User | null = await UserService.createUser(
            userData.username,
            userData.password
        )

        if (ret == null) {
            logger.error(`User was not created`)
            res.sendStatus(500)
        }

        res.sendStatus(200)
        return
    }

    /**
     * Change a users password.
     * @param req A ``PasswordChangeWebsite`` with the old and a new password.
     * @param res
     * @returns Nothing
     */
    private async changePassword(req: Request, res: Response): Promise<void> {
        const username: string = req.params.username
        const userData: PasswordChangeWebsite = req.body
        if (!validateSchema(userData, PasswordChangeSchemaWebsite)) {
            res.sendStatus(400)
            return
        }

        const success: boolean = await UserService.updatePassword(
            req.params.username,
            userData
        )

        if (!success) {
            res.sendStatus(400)
            return
        }

        res.sendStatus(200)
        return
    }

    /**
     * Delete a user with a certain uid.
     * @param req A request containing a userId in its parameters.
     * @param res
     * @returns Nothing
     */
    private async deleteUser(req: Request, res: Response): Promise<void> {
        if (!req.params || !req.params.userId) {
            res.sendStatus(400)
            return
        }
        const userIdToBeDeleted: number = parseInt(req.params.userId)
        const successful: boolean = await UserService.removeUser(
            userIdToBeDeleted,
            req.params.username
        )
        if (!successful) {
            res.sendStatus(500)
            return
        }
        res.sendStatus(200)
        return
    }
}
