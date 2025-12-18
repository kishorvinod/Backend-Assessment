import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { comparePasswords, generateRefreshToken, generateToken, hashPassword } from "../services/auth.service";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET ?? "your-secret-key";
const ACCESS_TOKEN_EXPIRES_IN = "1h";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, systemRole, status } = req.body;
    // Basic validation
    if (!email || !password || !name) {
      res.status(400).json({ message: "email, password and name are required" });
      return;
    }
    if (typeof password !== "string" || password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    // Check unique email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: "Email already in use" });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        systemRole: (systemRole as any) ?? "USER",
        status: (status as any) ?? "active"
      },
    });

    await prisma.userToken.create({
      data: {
        userId: user.id,
        isVerified: false,
      },
    });

    res.status(200).json({ message: "User registered successfully", user: { id: user.id, email: user.email, name: user.name, systemRole: user.systemRole } });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: "email and password required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { token: true }, 
    });
    if (!user || !(await comparePasswords(password, user.password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // create JWT access token valid 1 hour
    const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.systemRole }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    const refreshToken = generateRefreshToken();

    await prisma.userToken.update({
      where: { userId: user.id },
      data: { refreshToken },
    });

    const response = {
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: !!user.token?.isVerified,
        systemRole: user.systemRole,
      },
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: "Login error", error });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const userToken = await prisma.userToken.findFirst({
      where: { refreshToken },
    });

    if (!userToken) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    const newAccessToken = generateToken(userToken.userId, "");
    const newRefreshToken = generateRefreshToken();

    await prisma.userToken.update({
      where: { userId: userToken.userId }, // Using userId as the unique identifier
      data: { refreshToken: newRefreshToken },
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Error refreshing token", error });
  }
};