import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET ?? "supersecretkey";
const REFRESH_SECRET = process.env.REFRESH_SECRET ?? "refreshsecret";

/**
 * @desc Hash password before storing
 */
export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 10);
};

/**
 * @desc Compare passwords
 */
export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
};

/**
 * @desc Generate JWT Token
 */
export const generateToken = (userId: string, email: string): string => {
    return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: "1h" });
};

/**
 * @desc Verify JWT Token
 */
export const verifyToken = (token: string): any => {
    // Let jwt.verify throw its original error so callers can inspect/log the actual cause
    return jwt.verify(token, JWT_SECRET);
};

/**
 * @desc Generate Refresh Token
 */
export const generateRefreshToken = (): string => {
    return crypto.randomBytes(40).toString("hex");
};