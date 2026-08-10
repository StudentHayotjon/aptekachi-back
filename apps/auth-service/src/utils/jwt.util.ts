import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env.config";

export interface AccessTokenPayload {
    sub: string;
    role: Role;
}

export const signAccessToken = (payload: AccessTokenPayload): string => {
    return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessTtl });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
    return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
};
