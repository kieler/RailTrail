import { Server } from "../../server"
import { prismaMock } from "../../prisma/mockPrisma"
import request from "supertest"
import { Prisma } from "@prisma/client"
import { Feature, Point } from "geojson"
import CryptoService from "../../services/crypto.service"

const app = new Server().app

let token: string

beforeAll(async () => {
	const user = { username: "admin", password: "admin" }
	const hashedPassord = await CryptoService.produceHash(user.password)
	if (!hashedPassord) {
		return null
	}
	const userWithHashedPassword = { username: "admin", password: hashedPassord }
	prismaMock.user.findUnique.mockResolvedValue(userWithHashedPassword)
	const auth = await request(app).post("/api/login").send(user)
	token = auth.text.split(":")[1].replace("}", "").replaceAll('"', "")
})

describe("GET /poi", () => {
	test("two plus two is four", () => {
		expect(2 + 2).toBe(4)
	})

	test("Get all Poi's 200", async () => {
		const geoPos: Feature<Point> = {
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [12, 12]
			},
			properties: null
		}

		const prismaGeoPosJson = geoPos as unknown as Prisma.JsonValue

		const poisPayload = [
			{
				uid: 1,
				name: "Poi",
				description: "test",
				position: prismaGeoPosJson,
				isTurningPoint: false,
				typeId: 1,
				trackId: 1
			},
			{
				uid: 2,
				name: "Poi",
				description: "test",
				position: prismaGeoPosJson,
				isTurningPoint: false,
				typeId: 1,
				trackId: 1
			}
		]

		prismaMock.pOI.findMany.mockResolvedValue(poisPayload)
		const res = await request(app).get("/api/poi").set("Authorization", `Bearer ${token}`)
		expect(res.statusCode).toBe(200)
		expect(res.body).toStrictEqual([
			{
				description: "test",
				id: 1,
				isTurningPoint: false,
				name: "Poi",
				pos: { lat: 12, lng: 12 },
				trackId: 1,
				typeId: 1
			},
			{
				description: "test",
				id: 2,
				isTurningPoint: false,
				name: "Poi",
				pos: { lat: 12, lng: 12 },
				trackId: 1,
				typeId: 1
			}
		])
	})

	test("No POI's in DB 200", async () => {
		prismaMock.pOI.findMany.mockResolvedValue([])
		const res = await request(app).get("/api/poi").set("Authorization", `Bearer ${token}`)
		expect(res.statusCode).toBe(200)
		expect(res.body).toStrictEqual([])
	})
})
