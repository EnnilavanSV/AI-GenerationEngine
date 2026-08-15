// dotenv must run before ANY other import reads process.env.
// This was previously called after `const PORT = process.env.PORT || 5000`,
// which only worked by accident: aiController.js calls dotenv.config() during
// its own module evaluation, and ESM evaluates imports before the importing
// module's body. Remove that call and PORT plus GEMINI_API_KEY would silently
// become undefined. Loading config first makes the order explicit.
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.js";
import generateRoutes from "./routes/generate.js";

const app = express();
const PORT = process.env.PORT || 5000;


if (!process.env.GEMINI_API_KEY) {
  console.error(
    "FATAL: GEMINI_API_KEY is not set. Create server/.env with GEMINI_API_KEY=<your key>.",
  );
  process.exit(1);
}


app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/generate", generateRoutes);

app.get("/api/status", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI backend is running.",
    timestamp: new Date().toISOString(),
  });
});

// 404 for anything that didn't match a route above.
app.use((req, res) => {
  res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
});


app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
