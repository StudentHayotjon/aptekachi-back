import { Router } from "express";
import { Role } from "@prisma/client";
import { FamilyController } from "../controllers/family.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/rbac.middleware";
import { createCareLinkSchema, createFamilyMemberSchema } from "../dtos/family.dto";

export const familyRouter = Router();

familyRouter.post(
    "/members",
    authenticate,
    authorize(Role.BEMOR),
    validate(createFamilyMemberSchema),
    FamilyController.createFamilyMember
);
familyRouter.get("/members", authenticate, authorize(Role.BEMOR), FamilyController.listFamilyMembers);
familyRouter.delete("/members/:id", authenticate, authorize(Role.BEMOR), FamilyController.removeFamilyMember);

familyRouter.post("/links", authenticate, authorize(Role.BEMOR), validate(createCareLinkSchema), FamilyController.createCareLink);
familyRouter.get("/links", authenticate, authorize(Role.BEMOR), FamilyController.listCareLinks);
familyRouter.delete("/links/:id", authenticate, authorize(Role.BEMOR), FamilyController.removeCareLink);
