import { PrismaClient } from "@prisma/client"
import dotenv from "dotenv"
import { POITypeIcon } from "../src/models/api"
import CryptoService from "../src/services/crypto.service"
import database from "../src/services/database.service"
import { logger } from "../src/utils/logger"

const prisma = new PrismaClient()

/**
 * This script initialises the database with first entries.
 * (See docs: https://www.prisma.io/docs/guides/migrate/seed-database)
 *
 * The database schema is generated via `prisma db push`.
 * This script only initialises the database data if there is no data!
 */
async function main() {
	// Import variables from .env into process.env
	dotenv.config()
	const config = process.env

	// If no user exists: Create Initial User
	// Intial Users credentials are stored in environment variables
	// for security reasons
	if ((await database.users.getAll()).length == 0) {
		const pwd = await CryptoService.produceHash(config.INIT_PWD!)
		await database.users.save({ username: config.INIT_USR!, password: pwd! })
	}

	// If no type for POIs exist: Create Initial POITypes
	if ((await database.pois.getAllTypes()).length == 0) {
		// POIType: Level Crossing
		await database.pois.saveType({ name: "Level Crossing", icon: String(POITypeIcon.LevelCrossing) })

		// POIType: Lesser Level Crossing
		await database.pois.saveType({ name: "Lesser Level Crossing", icon: String(POITypeIcon.LesserLevelCrossing) })

		// POIType: Picnic
		await database.pois.saveType({ name: "Picnic", icon: String(POITypeIcon.Picnic) })

		// POIType: Track End
		await database.pois.saveType({ name: "Track End", icon: String(POITypeIcon.TrackEnd) })

		// POIType: Turning Point
		await database.pois.saveType({ name: "Turning Point", icon: String(POITypeIcon.TurningPoint) })
	}

	// If no type for Vehicles exist: Create Initial VehicleTypes
	if ((await database.vehicles.getAllTypes()).length == 0) {
		// VehicleType: Rail-Cycle Draisine
		await database.vehicles.saveType({ name: "Rail-Cycle Draisine", icon: "generic_rail_bound_vehicle.svg" })

		// VehicleType: Electric Draisine
		await database.vehicles.saveType({ name: "Electric Draisine", icon: "generic_rail_bound_vehicle.svg" })

		// VehicleType: Motor Draisine
		await database.vehicles.saveType({ name: "Motor Draisine", icon: "generic_rail_bound_vehicle.svg" })
	}
}
main()
	.then(async () => {
		await prisma.$disconnect()
	})
	.catch(async e => {
		logger.error(e)
		await prisma.$disconnect()
		process.exit(1)
	})
