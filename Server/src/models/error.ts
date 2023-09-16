export class HTTPError extends Error {
	public statusCode: number
	constructor(msg: string, statusCode: number) {
		super(msg)
		this.statusCode = statusCode
	}
}
