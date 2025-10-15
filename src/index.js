import express from "express";
import { requestLogger } from "./authorization/logger.js";
import dotenv from "dotenv";
import { authRoutes } from "./authorization/auth.js";
import usersRouter from "./routes/users.js";
import hostsRouter from "./routes/hosts.js";
import propertiesRouter from "./routes/properties.js";
import bookingsRouter from "./routes/bookings.js";
import reviewsRouter from "./routes/reviews.js";
import * as Sentry from "@sentry/node";

dotenv.config();

const app = express();

// Sentry init
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

// Sentry request handler
app.use(Sentry.Handlers.requestHandler());

app.use(express.json());
app.use(requestLogger);

// Auth routes (signup/login/protected)
app.use("/", authRoutes);

// Base routes
app.use("/users", usersRouter);
app.use("/hosts", hostsRouter);
app.use("/properties", propertiesRouter);
app.use("/bookings", bookingsRouter);
app.use("/reviews", reviewsRouter);

// Root
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Express Bookings API!" });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;

  // Colors for console
  const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
  };
  const color = statusCode >= 500 ? colors.red : colors.yellow;

  // Console logging
  console.error(
    `${color}❌ [${new Date().toISOString()}] ${req.method} ${
      req.originalUrl
    } - ${statusCode}: ${err.message}${colors.reset}`
  );

  // Send to Sentry
  Sentry.captureException(err);

  // JSON response
  res.status(statusCode).json({
    success: false,
    error: err.message || "An unexpected error occurred on the server.",
    status: statusCode,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// Sentry error handler
app.use(Sentry.Handlers.errorHandler());

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== "negative") {
    console.log(
      "⚠️  For negative test use: NODE_ENV=negative npm run reset-db"
    );
  }
});
