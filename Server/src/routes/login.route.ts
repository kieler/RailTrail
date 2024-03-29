import { Request, Response, Router } from "express"
import { AuthenticationRequest, AuthenticationResponse } from "../models/api.website"
import LoginService from "../services/login.service"
import { jsonParser } from "."
import please_dont_crash from "../utils/please_dont_crash"
import { z } from "zod"

/**
 * The router class for the routing of the login dialog with the website.
 */
export class LoginRoute {
	/** The path of this api route. */
	public static path: string = "/"
	/** The sub router instance. */
	private static instance: LoginRoute
	/** The base router object. */
	private router = Router()

	/**
	 * The constructor to connect all the routes with specific functions.
	 */
	private constructor() {
		this.router.post("/login", jsonParser, please_dont_crash(this.login))
	}

	/**
	 * Creates an instance if there is none yet.
	 */
	static get router() {
		if (!LoginRoute.instance) {
			LoginRoute.instance = new LoginRoute()
		}
		return LoginRoute.instance.router
	}

	/**
	 * This function handles the login.
	 * @param req The request should contain a requestbody that contains an AuthenticationRequest.
	 * @param res An AuthenticationResponse (i.e. an authentication token) if successful
	 * @returns Nothing.
	 */
	private login = async (req: Request, res: Response) => {
		const authData = AuthenticationRequest.parse(req.body)

		// Call the corresponding service
		const token: z.infer<typeof AuthenticationResponse> = await LoginService.login(authData)
		res.json(token)
		return
	}
}
