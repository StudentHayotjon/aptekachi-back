import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { forgotPasswordSchema, loginSchema, refreshSchema, registerSchema, resetPasswordSchema } from "../dtos/auth.dto";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), AuthController.register);
authRouter.post("/login", validate(loginSchema), AuthController.login);
authRouter.post("/refresh", validate(refreshSchema), AuthController.refresh);
authRouter.post("/logout", validate(refreshSchema), AuthController.logout);
authRouter.get("/me", authenticate, AuthController.me);
authRouter.post("/forgot-password", validate(forgotPasswordSchema), AuthController.forgotPassword);
authRouter.post("/reset-password", validate(resetPasswordSchema), AuthController.resetPassword);
