import express from "express";
import "dotenv/config";
import { uploadSingle } from "./middleware/upload.middleware";
import { OcrController } from "./controllers/ocr.controller";
import { ReqType, ResType } from "./types/express.types";
import { errorHandler } from "./middleware/error.middleware";

const app = express();
const port = process.env.PORT ?? 3000;
app.use(express.json());
app.get("/health", (req: ReqType, res: ResType) => {
    res.status(200).json({ success: true, message: "OK" });
});

app.post("/api/ocr/analyze", uploadSingle("file"), OcrController.analyzePrescription);
app.use(errorHandler);
app.listen(port, () => {
    console.log(`Server ${port} portda ishga tushdi`);
});
