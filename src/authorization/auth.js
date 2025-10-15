import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.AUTH_SECRET_KEY;

// --- Middleware: Token verification ---
export function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ message: "Invalid or expired token" });
  }
}

// --- Signup ---
router.post("/signup", async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existingUser) return res.status(409).json({ message: "User exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, username, email, password: hashedPassword },
  });

  res.status(201).json({ message: "User created", user });
});

// --- Login ---
router.post("/login", async (req, res) => {
  const { email, username, password } = req.body;
  const identifier = email || username;

  if (!identifier || !password)
    return res
      .status(400)
      .json({ message: "Email/username and password required" });

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
  });
  if (!user) return res.status(401).json({ message: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
  res.status(200).json({ token, userId: user.id, username: user.username });
});

// --- Protected route ---
router.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "You have access!", user: req.user });
});

export { router as authRoutes };
