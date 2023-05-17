import { config } from '../config';
import  Pool  from './db/database.connector';

import UserController from './db/user.controller';

/**
 * Database class
 * 
 * Represents the database connection for other modules.
 * Use the following controllers to access the data:
 * - `users` User Controller to access user specific data. (e.g. find a user by username)
 */
export class Database {
    public users = new UserController(Pool);
}