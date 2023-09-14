import { Server } from "../../server"
import request from "supertest"

const app = new Server().app

describe("/poi", () => {
	test("two plus two is four", () => {
		expect(2 + 2).toBe(4)
	})

	test("GET /", done => {
		request(app)
			.get("/api/poi")
			.then(response => {
				expect(response.statusCode).toBe(401)
				done()
			})
	})
	describe("/poi2", () => {
		test("two plus two is four", () => {
			expect(2 + 2).toBe(4)
		})

		test("GET /", done => {
			request(app)
				.get("/api/poi")
				.then(response => {
					expect(response.statusCode).toBe(401)
					done()
				})
		})
	})
})
