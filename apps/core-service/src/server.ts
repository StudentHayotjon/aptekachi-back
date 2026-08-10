import express from "express";
import "dotenv/config";
import { env } from "./config/env.config";
import { authRouter } from "./modules/auth/auth.routes";
import { ReqType, ResType } from "./types/express.types";
import { errorHandler } from "./middleware/error.middleware";

const app = express();
app.use(express.json());

app.get("/health", (req: ReqType, res: ResType) => {
    res.status(200).json({ success: true, message: "OK" });
});

app.use("/api/v1/auth", authRouter);
// Kelajakdagi modullar shu yerga qo'shiladi:
// app.use("/api/v1/drugs", drugRouter);
// app.use("/api/v1/prescriptions", prescriptionRouter);
app.use(errorHandler);

app.listen(env.port, () => {
    console.log(`Core Service ${env.port} portda ishga tushdi`);
});
