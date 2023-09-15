import { PrismaClient } from "@prisma/client"
import { mockDeep, DeepMockProxy, mockReset } from "jest-mock-extended"

import prisma from "./client"

jest.mock("./client", () => ({
	__esModule: true,
	default: mockDeep<PrismaClient>()
}))

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

beforeEach(() => {
	mockReset(prismaMock)
})
