import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../services/auth.service";

const prisma = new PrismaClient();

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ message: "Unauthorized: No token provided" });
        return;
    }

    // Accept "Bearer <token>" case-insensitive and trim
    const token = authHeader.replace(/^[Bb]earer\s+/, "").trim();

    if (!token) {
        res.status(401).json({ message: "Authentication token required" });
        return;
    }

    try {
        const decoded: any = verifyToken(token);

        // Robust extraction: check common claim names used for user identifier
        const lookupId = decoded?.id ?? decoded?.userId ?? decoded?.sub;
        const lookupEmail = decoded?.email;

        if (!lookupId && !lookupEmail) {
            console.error("JWT payload missing id/userId/sub/email:", decoded);
            res.status(401).json({ message: "Invalid token payload" });
            return;
        }

        // Prefer id lookup, fallback to email
        const user = lookupId
            ? await prisma.user.findUnique({ where: { id: lookupId } })
            : await prisma.user.findUnique({ where: { email: lookupEmail } });

        if (!user) {
            res.status(401).json({ message: "Invalid token: user not found" });
            return;
        }

        req.user = { id: user.id, email: user.email, systemRole: user.systemRole };
        next();
    } catch (error: any) {
        // Log server-side for diagnosis
        console.error("JWT verification error:", error && error.message ? error.message : error);
        const devMsg = process.env.NODE_ENV === "development" ? (error && error.message ? error.message : "Invalid token") : "Invalid or expired token";
        res.status(401).json({ message: devMsg });
        return;
    }
};
