import { Request, Response, Router } from "express";
import {
	AuthenticationRequest,
	PasswordChange,
	UserList,
} from "../models/api_types";

import { authenticateJWT, jsonParser, v } from ".";
import {
	AuthenticationRequestSchema,
	PasswordChangeSchema,
} from "../models/jsonschemas";
import UserService from "../services/user.service";
import { User } from "../models";

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
		res.json(UserService.getAllUsers());
		return;
	};

	private addNewUser = async (req: Request, res: Response) => {
		const userData: AuthenticationRequest = req.body;
		if (!userData || v.validate(userData, AuthenticationRequestSchema).valid) {
			res.sendStatus(400);
			return;
		}
		const ret: Promise<User | null> = UserService.createUser(userData.username, userData.password);
		if (ret == null) {
			res.sendStatus(500);
		}

		res.sendStatus(200);
		return;
	};

	private changePassword = async (req: Request, res: Response) => {
		const userData: PasswordChange = req.body;
		if (!userData || v.validate(userData, PasswordChangeSchema).valid) {
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
