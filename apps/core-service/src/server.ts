import express from "express";
import path from "node:path";
import "dotenv/config";
import { env } from "./config/env.config";
import { authRouter } from "./routes/auth.routes";
import { drugRouter } from "./routes/drug.routes";
import { prescriptionRouter } from "./routes/prescription.routes";
import { scheduleRouter } from "./routes/schedule.routes";
import { doseRouter } from "./routes/dose.routes";
import { ReqType, ResType } from "./types/express.types";
import { errorHandler } from "./middleware/error.middleware";
import { startDoseJobs } from "./jobs/dose-scheduler.job";

const app = express();
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (req: ReqType, res: ResType) => {
    res.status(200).json({ success: true, message: "OK" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/drugs", drugRouter);
app.use("/api/v1/prescriptions", prescriptionRouter);
app.use("/api/v1/schedules", scheduleRouter);
app.use("/api/v1/doses", doseRouter);
// Kelajakdagi modullar shu yerga qo'shiladi:
// app.use("/api/v1/notifications", notificationRouter);
app.use(errorHandler);

app.listen(env.port, () => {
    console.log(`Core Service ${env.port} portda ishga tushdi`);
});

startDoseJobs();
