import express from "express";
import { connectToDatabase } from "./services/database.service"
import { router } from "./controller/railtrail.router";


const app = express();
const port = 8080;

connectToDatabase()
    .then(() => {
        app.use("/", router);

        app.listen(port, () => {
            console.log(`Server started at http://localhost:${port}`);
        });
    })
    .catch((error: Error) => {
        console.error("Database connection failed", error);
        process.exit();
    });