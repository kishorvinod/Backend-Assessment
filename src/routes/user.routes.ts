import express from "express";
import { getUsers, getUserProfile, updateUser, deleteUser } from "../controllers/user.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Fetch logged-in user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get("/me", authenticateToken, getUserProfile);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List users (admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, inactive]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/", authenticateToken, getUsers);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user status (admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Updated user
 */
router.put("/:id", authenticateToken, updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Soft delete user (admin only) - sets status to inactive
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Soft-deleted user
 */
router.delete("/:id", authenticateToken, deleteUser);

export default router;