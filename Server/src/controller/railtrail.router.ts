import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../services/database.service";

export const router = express.Router();
router.use(express.json());

router.get("/", async (req: Request, res: Response) => {
    res.status(200).send("Hello World");
});