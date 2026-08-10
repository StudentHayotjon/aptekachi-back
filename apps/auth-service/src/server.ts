import express from "express";
import "dotenv/config";
import { env } from "./config/env.config";
import { authRouter } from "./routes/auth.routes";
import { ReqType, ResType } from "./types/express.types";
import { errorHandler } from "./middleware/error.middleware";

const app = express();
app.use(express.json());

app.get("/health", (req: ReqType, res: ResType) => {
    res.status(200).json({ success: true, message: "OK" });
});

app.use("/api/v1/auth", authRouter);
app.use(errorHandler);

app.listen(env.port, () => {
    console.log(`Auth Service ${env.port} portda ishga tushdi`);
});
