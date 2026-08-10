import { Router } from "express";
import { Role } from "@prisma/client";
import { DrugController } from "../controllers/drug.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { createDrugSchema, updateDrugSchema } from "../dtos/drug.dto";

export const drugRouter = Router();

drugRouter.get("/", DrugController.list);
drugRouter.get("/:id", DrugController.getById);
drugRouter.post("/", authenticate, authorize(Role.ADMINISTRATOR), validate(createDrugSchema), DrugController.create);
drugRouter.put("/:id", authenticate, authorize(Role.ADMINISTRATOR), validate(updateDrugSchema), DrugController.update);
drugRouter.delete("/:id", authenticate, authorize(Role.ADMINISTRATOR), DrugController.remove);
