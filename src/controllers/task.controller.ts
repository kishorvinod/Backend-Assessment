import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/*
  Note: This controller expects an auth middleware that sets (req as any).user.
  If not present, minimal fields in bodies are still accepted but requester checks
  below will require authentication.
*/

export const createTask = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!requester) return res.status(401).json({ error: "Unauthorized" });

    const { title, description, assigned_to } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "title and description are required" });
    }

    const data: any = {
      title,
      description,
      created_by: requester.id,
      assigned_to: assigned_to ?? requester.id,
    };

    const task = await prisma.task.create({ data });
    return res.status(201).json(task);
  } catch (err) {
    console.error("createTask error:", err);
    return res.status(500).json({ error: "Failed to create task" });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!requester) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    const updates = req.body;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Completed tasks cannot be edited
    if (task.status === "completed") {
      return res.status(400).json({ error: "Completed tasks cannot be edited" });
    }

    // If trying to set status to completed, enforce that only assigned user can do it
    if (updates.status === "completed") {
      if (requester.id !== task.assigned_to) {
        return res.status(403).json({ error: "Only the assigned user can mark task as completed" });
      }
      updates.completed_at = new Date();
    }

    // Apply allowed updates (avoid changing id/created_at)
    const allowed: any = {};
    if (updates.title !== undefined) allowed.title = updates.title;
    if (updates.description !== undefined) allowed.description = updates.description;
    if (updates.status !== undefined) allowed.status = updates.status;
    if (updates.assigned_to !== undefined) allowed.assigned_to = updates.assigned_to;
    if (updates.completed_at !== undefined) allowed.completed_at = updates.completed_at;

    const updated = await prisma.task.update({
      where: { id },
      data: allowed,
    });

    return res.json(updated);
  } catch (err) {
    console.error("updateTask error:", err);
    return res.status(500).json({ error: "Failed to update task" });
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!requester) return res.status(401).json({ error: "Unauthorized" });

    // Optional query filters could be added (status, assigned_to, etc.)
    const tasks = await prisma.task.findMany({
      include: {
        assignedTo: {
          select: { id: true, email: true, name: true },
        },
        createdBy: {
          select: { id: true, email: true, name: true },
        },
        comments: true,
      },
      orderBy: { created_at: "desc" },
    });
    return res.json(tasks);
  } catch (err) {
    console.error("getTasks error:", err);
    return res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!requester) return res.status(401).json({ error: "Unauthorized" });

    const { id: task_id } = req.params;
    const { comment } = req.body;
    if (!comment) return res.status(400).json({ error: "comment is required" });

    const task = await prisma.task.findUnique({ where: { id: task_id } });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const created = await prisma.taskComment.create({
      data: {
        task_id,
        user_id: requester.id,
        comment,
      },
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("addComment error:", err);
    return res.status(500).json({ error: "Failed to add comment" });
  }
};

export const listComments = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!requester) return res.status(401).json({ error: "Unauthorized" });

    const { id: task_id } = req.params;
    const task = await prisma.task.findUnique({ where: { id: task_id } });
    if (!task) return res.status(404).json({ error: "Task not found" });

    const comments = await prisma.taskComment.findMany({
      where: { task_id },
      orderBy: { created_at: "asc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return res.json(comments);
  } catch (err) {
    console.error("listComments error:", err);
    return res.status(500).json({ error: "Failed to list comments" });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!requester) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Only admin or task creator can delete
    if (requester.systemRole !== "ADMIN" && requester.id !== task.created_by) {
      return res.status(403).json({ error: "Forbidden: only admin or task creator can delete task" });
    }

    // delete related comments first, then task
    await prisma.$transaction([
      prisma.taskComment.deleteMany({ where: { task_id: id } }),
      prisma.task.delete({ where: { id } }),
    ]);

    return res.json({ message: "Task and related comments deleted", taskId: id });
  } catch (err) {
    console.error("deleteTask error:", err);
    return res.status(500).json({ error: "Failed to delete task" });
  }
};
