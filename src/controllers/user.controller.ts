import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getUserProfile = async (req: Request, res: Response) => {
	try {
		const requester = (req as any).user;
		if (!requester) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const user = await prisma.user.findUnique({
			where: { id: requester.id },
			select: { id: true, email: true, name: true, systemRole: true, status: true, created_at: true, updated_at: true },
		});

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		return res.json(user);
	} catch (error) {
		return res.status(500).json({ error: "Error fetching profile" });
	}
};

export const getUsers = async (req: Request, res: Response) => {
	try {
		const requester = (req as any).user;
		if (!requester || requester.systemRole !== "ADMIN") {
			return res.status(403).json({ error: "Forbidden: admin only" });
		}

		const page = Math.max(parseInt((req.query.page as string) ?? "1", 10), 1);
		const limit = Math.max(parseInt((req.query.limit as string) ?? "10", 10), 1);
		const skip = (page - 1) * limit;
		const statusQuery = ((req.query.status as string) ?? "all").toLowerCase();

		const where: any = {};
		if (statusQuery !== "all") {
			if (!["active", "inactive"].includes(statusQuery)) {
				return res.status(400).json({ error: "Invalid status filter" });
			}
			where.status = statusQuery;
		}

		const [users, total] = await Promise.all([
			prisma.user.findMany({
				where,
				skip,
				take: limit,
				select: { id: true, email: true, name: true, systemRole: true, status: true, created_at: true },
			}),
			prisma.user.count({ where }),
		]);

		return res.json({ page, limit, total, users });
	} catch (error) {
		return res.status(500).json({ error: "Error fetching users" });
	}
};

export const updateUser = async (req: Request, res: Response) => {
	// filepath: k:\Github project\Logezy-Backend-Assignment\Backend-Assessment\src\controllers\user.controller.ts
	try {
		const requester = (req as any).user;
		if (!requester || requester.systemRole !== "ADMIN") {
			return res.status(403).json({ error: "Forbidden: admin only" });
		}

		const { id } = req.params;
		const { status } = req.body;

		if (!status || !["active", "inactive"].includes(status)) {
			return res.status(400).json({ error: "Invalid or missing status. Allowed: active, inactive" });
		}

		const updated = await prisma.user.update({
			where: { id },
			data: { status },
			select: { id: true, email: true, name: true, systemRole: true, status: true, updated_at: true },
		});

		return res.json(updated);
	} catch (error) {
		return res.status(500).json({ error: "Error updating user" });
	}
};

export const deleteUser = async (req: Request, res: Response) => {
	// filepath: k:\Github project\Logezy-Backend-Assignment\Backend-Assessment\src\controllers\user.controller.ts
	try {
		const requester = (req as any).user;
		if (!requester || requester.systemRole !== "ADMIN") {
			return res.status(403).json({ error: "Forbidden: admin only" });
		}

		const { id } = req.params;

		// Soft delete by setting status to inactive
		const user = await prisma.user.update({
			where: { id },
			data: { status: "inactive" },
			select: { id: true, email: true, name: true, status: true },
		});

		return res.json({ message: "User soft-deleted (set to inactive)", userId: user.id });
	} catch (error) {
		return res.status(500).json({ error: "Error deleting user" });
	}
};