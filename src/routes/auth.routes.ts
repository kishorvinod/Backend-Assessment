import express from "express";
import { register, login, refreshToken } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Creates a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               name:
 *                 type: string
 *                 format: name
 *               systemRole:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: User successfully registered
 *       400:
 *         description: Invalid input
 *       409:
 *         description: User already exists
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticate user and return JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Invalid input
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Get new access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refresh successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh-token", refreshToken);


export default router;