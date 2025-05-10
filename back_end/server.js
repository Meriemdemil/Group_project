import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import conversationRoutes from "./routes/conversations.js";

console.log("🚀 Server script starting up...");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api/conversations", conversationRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
app.use((req, res) => {
  console.log("❌ Unmatched route:", req.method, req.url);
  res.status(404).send("Not found");
});

