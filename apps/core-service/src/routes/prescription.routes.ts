import { Router } from "express";
import { Role } from "@prisma/client";
import { PrescriptionController } from "../controllers/prescription.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { uploadMiddleware } from "../middleware/upload.middleware";
import { dmedImportSchema, rejectPrescriptionSchema } from "../dtos/prescription.dto";

export const prescriptionRouter = Router();

prescriptionRouter.post(
    "/",
    authenticate,
    authorize(Role.BEMOR),
    uploadMiddleware.single("file"),
    PrescriptionController.create
);
prescriptionRouter.post(
    "/dmed",
    authenticate,
    authorize(Role.BEMOR),
    validate(dmedImportSchema),
    PrescriptionController.importFromDmed
);
prescriptionRouter.get("/", authenticate, PrescriptionController.list);
prescriptionRouter.get("/:id", authenticate, PrescriptionController.getById);
prescriptionRouter.patch("/:id/approve", authenticate, authorize(Role.SHIFOKOR), PrescriptionController.approve);
prescriptionRouter.patch(
    "/:id/reject",
    authenticate,
    authorize(Role.SHIFOKOR),
    validate(rejectPrescriptionSchema),
    PrescriptionController.reject
);
