import { Router } from "express";
import { Role } from "@prisma/client";
import { InteractionController } from "../controllers/interaction.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { checkInteractionsSchema, createInteractionSchema } from "../dtos/interaction.dto";

export const interactionRouter = Router();

interactionRouter.post(
    "/",
    authenticate,
    authorize(Role.ADMINISTRATOR),
    validate(createInteractionSchema),
    InteractionController.create
);
interactionRouter.get("/", authenticate, authorize(Role.ADMINISTRATOR), InteractionController.list);
interactionRouter.delete("/:id", authenticate, authorize(Role.ADMINISTRATOR), InteractionController.remove);
interactionRouter.post("/check", authenticate, validate(checkInteractionsSchema), InteractionController.check);
