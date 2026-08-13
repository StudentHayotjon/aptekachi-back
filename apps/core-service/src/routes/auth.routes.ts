import { Router } from "express";
import { Role } from "@prisma/client";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import {
    forgotPasswordSchema,
    loginSchema,
    provisionUserSchema,
    refreshSchema,
    registerSchema,
    resetPasswordSchema,
    updateUserStatusSchema
} from "../dtos/auth.dto";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), AuthController.register);
authRouter.post("/login", validate(loginSchema), AuthController.login);
authRouter.post("/refresh", validate(refreshSchema), AuthController.refresh);
authRouter.post("/logout", validate(refreshSchema), AuthController.logout);
authRouter.get("/me", authenticate, AuthController.me);
authRouter.post("/forgot-password", validate(forgotPasswordSchema), AuthController.forgotPassword);
authRouter.post("/reset-password", validate(resetPasswordSchema), AuthController.resetPassword);

authRouter.get("/users", authenticate, authorize(Role.ADMINISTRATOR), AuthController.listUsers);
authRouter.patch(
    "/users/:id/status",
    authenticate,
    authorize(Role.ADMINISTRATOR),
    validate(updateUserStatusSchema),
    AuthController.updateUserStatus
);
authRouter.post(
    "/users/provision",
    authenticate,
    authorize(Role.ADMINISTRATOR),
    validate(provisionUserSchema),
    AuthController.provision
);
