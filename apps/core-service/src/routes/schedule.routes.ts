import { Router } from "express";
import { Role } from "@prisma/client";
import { ScheduleController } from "../controllers/schedule.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { createScheduleSchema } from "../dtos/schedule.dto";

export const scheduleRouter = Router();

scheduleRouter.post("/", authenticate, authorize(Role.BEMOR), validate(createScheduleSchema), ScheduleController.create);
scheduleRouter.get("/", authenticate, authorize(Role.BEMOR), ScheduleController.list);
scheduleRouter.get("/:id", authenticate, authorize(Role.BEMOR), ScheduleController.getById);
scheduleRouter.patch("/:id/deactivate", authenticate, authorize(Role.BEMOR), ScheduleController.deactivate);
