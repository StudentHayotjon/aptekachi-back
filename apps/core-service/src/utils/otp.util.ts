import { randomInt, createHash } from "node:crypto";

export const generateOtpCode = (): string => {
    return randomInt(0, 1_000_000).toString().padStart(6, "0");
};

export const hashOtpCode = (code: string): string => {
    return createHash("sha256").update(code).digest("hex");
};
