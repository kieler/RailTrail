import { config } from '../config';
import { PrismaClient } from '@prisma/client'

/**
 * Database class
 *
 * Represents the database connection for other modules and stores
 * controller to access the different types of data models:
 * users, logs, vehicles, tracks, trackers & pois
 */
export class Database {

    private prisma = new PrismaClient();

}

const database : Database = new Database();
export default database;