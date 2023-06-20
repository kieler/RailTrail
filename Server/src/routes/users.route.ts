import { Request, Response, Router } from "express";
import {
	AuthenticationRequestWebsite,
	PasswordChangeWebsite,
	UserListWebsite,
} from "../models/api.website";

import { authenticateJWT, jsonParser, v } from ".";
import {
	AuthenticationRequestSchemaWebsite,
	PasswordChangeSchemaWebsite,
} from "../models/jsonschemas.website";
import UserService from "../services/user.service";
import { User } from "../models";
import { logger } from "../utils/logger";

export class UsersRoute {
	public static path: string = "/users";
	private static instance: UsersRoute;
	private router = Router();

	private constructor() {
		this.router.get("/website", authenticateJWT, this.getUserList);
		this.router.post("/website", authenticateJWT, jsonParser, this.addNewUser);
		this.router.post(
			"/website/password",
			authenticateJWT,
			jsonParser,
			this.changePassword
		);
		this.router.delete("/website/:userId", authenticateJWT, this.deleteUser);
	}

	static get router() {
		if (!UsersRoute.instance) {
			UsersRoute.instance = new UsersRoute();
		}
		return UsersRoute.instance.router;
	}

	private getUserList = async (req: Request, res: Response) => {
		logger.info(`Getting the user list`)
		res.json(await UserService.getAllUsers());
		return;
	};

	private addNewUser = async (req: Request, res: Response) => {
		const userData: AuthenticationRequestWebsite = req.body
		if (!userData 
			//|| v.validate(userData, AuthenticationRequestSchema).valid
			) {
			logger.error(`AuthenticationRequest could not be parsed: ${userData}`)
			res.sendStatus(400)
			return
		}
		const ret: User | null  = await UserService.createUser(userData.username, userData.password)
		if (ret == null) {
			logger.error(`User was not created`)
			res.sendStatus(500)
		}

		res.sendStatus(200)
		return
	};

	private changePassword = async (req: Request, res: Response) => {
		const username: string = req.params.username 
		const userData: PasswordChangeWebsite = req.body;
		if (!userData
			// || v.validate(userData, PasswordChangeSchema).valid
			) {
			res.sendStatus(400);
			return;
		}
		const success: boolean = await UserService.updatePassword(req.params.username, userData);
		if (!success){
			res.sendStatus(400);
			return
		}

		res.sendStatus(200);
		return;
	};

	private deleteUser = async (req: Request, res: Response) => {
		if (!req.params || !req.params.userId) {
			res.sendStatus(400);
			return;
		}
		const userIdToBeDeleted: number = parseInt(req.params?.userId);
		const successful: boolean = await UserService.removeUser(userIdToBeDeleted, req.params.username);
		if (successful) {
			res.sendStatus(200)
			return
		}
		res.sendStatus(400)
		return
	};
}
