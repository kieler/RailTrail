import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";

export const collections: { adminUsers?:mongoDB.Collection, } = {}

export async function connectToDatabase () {
    dotenv.config();
    console.log("Connecting to MongoDB");  
 
    const client: mongoDB.MongoClient = new mongoDB.MongoClient("mongodb://" + 
    process.env.MONGODB_HOST + 
    ":" + process.env.MONGODB_PORT + "/" + process.env.MONGODB_NAME);
            
    await client.connect();
        
    const db: mongoDB.Db = client.db(process.env.MONGODB_NAME);
    console.log(`Successfully connected to database: ${db.databaseName}`);

    // TODO: Now add all the collections
   
    const adminUsers: mongoDB.Collection = db.collection('adminUsers');
 
    collections.adminUsers = adminUsers;
       
 }