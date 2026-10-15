import { Router } from "express";
import { Role } from "@prisma/client";
import { AdminController } from "../controllers/admin.controller";
import { DrugController } from "../controllers/drug.controller";
import { InteractionController } from "../controllers/interaction.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { uploadSingle } from "../middleware/upload.middleware";
import { updateUserStatusSchema } from "../dtos/auth.dto";
import { createDrugSchema, updateDrugSchema } from "../dtos/drug.dto";
import { createInteractionSchema } from "../dtos/interaction.dto";
import {
    adminBlockUserSchema,
    adminCreateUserSchema,
    adminResetPasswordSchema,
    adminUpdateInteractionSchema,
    adminUpdateStockSchema,
    adminUpdateUserSchema
} from "../dtos/admin.dto";

// Admin panel uchun yagona prefiks: /api/v1/admin — barcha yo'llar faqat ADMINISTRATOR uchun.
export const adminRouter = Router();

adminRouter.use(authenticate, authorize(Role.ADMINISTRATOR));

adminRouter.get("/stats", AdminController.stats);
adminRouter.get("/system/health", AdminController.systemHealth);
// OCR xizmati tashqariga ochilmaydi — admin panel unga faqat shu himoyalangan proksi orqali murojaat qiladi
adminRouter.post("/ocr/analyze", uploadSingle("file"), AdminController.analyzeOcr);

adminRouter.get("/users", AdminController.listUsers);
adminRouter.post("/users", validate(adminCreateUserSchema), AdminController.createUser);
adminRouter.get("/users/:id", AdminController.getUser);
adminRouter.patch("/users/:id", validate(adminUpdateUserSchema), AdminController.updateUser);
adminRouter.delete("/users/:id", AdminController.deleteUser);
adminRouter.patch("/users/:id/status", validate(updateUserStatusSchema), AdminController.updateUserStatus);
adminRouter.post("/users/:id/block", validate(adminBlockUserSchema), AdminController.blockUser);
adminRouter.post("/users/:id/unblock", AdminController.unblockUser);
adminRouter.post("/users/:id/reset-password", validate(adminResetPasswordSchema), AdminController.resetUserPassword);
adminRouter.post("/users/:id/revoke-sessions", AdminController.revokeUserSessions);

adminRouter.get("/prescriptions", AdminController.listPrescriptions);
adminRouter.get("/prescriptions/:id", AdminController.getPrescription);

adminRouter.get("/drugs", AdminController.listDrugs);
adminRouter.post("/drugs", validate(createDrugSchema), DrugController.create);
adminRouter.get("/drugs/:id", AdminController.getDrug);
adminRouter.put("/drugs/:id", validate(updateDrugSchema), DrugController.update);
adminRouter.delete("/drugs/:id", DrugController.remove);
adminRouter.patch("/drugs/:id/restore", AdminController.restoreDrug);
adminRouter.patch("/drugs/:id/stock", validate(adminUpdateStockSchema), AdminController.updateDrugStock);

adminRouter.get("/interactions", AdminController.listInteractions);
adminRouter.post("/interactions", validate(createInteractionSchema), InteractionController.create);
adminRouter.patch("/interactions/:id", validate(adminUpdateInteractionSchema), AdminController.updateInteraction);
adminRouter.delete("/interactions/:id", InteractionController.remove);
