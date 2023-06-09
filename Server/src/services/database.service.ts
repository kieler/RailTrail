import { config } from '../config';
import { PrismaClient } from '@prisma/client'
import UserController from './db/user.controller';
import POIController from './db/poi.controller';
import TrackController from './db/track.controller';
import VehicleController from './db/vehicle.controller';
import TrackerController from './db/tracker.controller';

/**
 * Database class
 *
 * Represents the database connection for other modules and stores
 * controller to access the different types of data models:
 * users, logs, vehicles, tracks, trackers & pois
 */
export class Database {

    private prisma = new PrismaClient();

    public pois = new POIController(this.prisma);
    public tracks = new TrackController(this.prisma);
    public trackers = new TrackerController(this.prisma);
    public users = new UserController(this.prisma);
    public vehicles = new VehicleController(this.prisma);

}

const database : Database = new Database();
export default database;