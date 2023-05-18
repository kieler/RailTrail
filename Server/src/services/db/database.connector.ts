import { config } from '../../config';
import { Pool } from 'pg';

/**
 * Pool from postgres module (pg)
 * 
 * Uses the configuration to establishes a connection to the postgres database.
 */
export default new Pool({
    user: config.POSTGRES_USER,
    host: config.POSTGRES_HOST,
    database: 'railtrail',
    password: config.POSTGRES_PASSWORD,
    port: ((config.POSTGRES_PORT as unknown) as number),
})