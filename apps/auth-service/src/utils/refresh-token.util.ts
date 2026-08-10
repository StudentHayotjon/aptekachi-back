import { randomBytes, createHash } from "node:crypto";

export interface GeneratedRefreshToken {
    token: string;
    tokenHash: string;
}

export const generateRefreshToken = (): GeneratedRefreshToken => {
    const token = randomBytes(48).toString("hex");
    return { token, tokenHash: hashRefreshToken(token) };
};

export const hashRefreshToken = (token: string): string => {
    return createHash("sha256").update(token).digest("hex");
};
