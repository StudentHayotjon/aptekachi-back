import { Router } from "express";
import { Role } from "@prisma/client";
import { DoseController } from "../controllers/dose.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";

export const doseRouter = Router();

doseRouter.get("/", authenticate, authorize(Role.BEMOR), DoseController.list);
doseRouter.patch("/:id/confirm", authenticate, authorize(Role.BEMOR), DoseController.confirm);
doseRouter.patch("/:id/skip", authenticate, authorize(Role.BEMOR), DoseController.skip);
