import express from "express";
import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();


router.post("/", async (req, res) => {
  const { userId, title, id } = req.body;
  const conversationId = id || uuidv4();

  try {
    const result = await pool.query(
      "INSERT INTO conversations (id, user_id, title) VALUES ($1, $2, $3) RETURNING *",
      [conversationId, userId, title]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error inserting conversation:", err);
    res.status(500).json({ error: err.message });
  }
});


router.post("/messages", async (req, res) => {
  // Log full request body
  console.log("📥 Message POST request received:", req.body);

  const { conversation_id, role, content } = req.body;

  // Check if anything is missing
  if (!conversation_id || !role || !content) {
    console.log("❌ Missing field(s):", { conversation_id, role, content });
    return res
      .status(400)
      .json({ error: "Missing conversation_id, role, or content." });
  }

  try {
    const result = await pool.query(
      "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3) RETURNING *",
      [conversation_id, role, content]
    );

    console.log("✅ Message inserted into DB:", result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ DB error inserting message:", err.message);
    res.status(500).json({ error: err.message });
  }
});


router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/messages/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  console.log('📥 Fetching messages for conversation:', conversationId); // <--- this must appear

  try {
    const result = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY timestamp ASC',
      [conversationId]
    );
    console.log('📦 Messages fetched:', result.rows); // <--- this one too
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching messages:', err); // <--- will show errors
    res.status(500).json({ error: err.message });
  }
});


router.delete("/:conversationId", async (req, res) => {
  const { conversationId } = req.params;

  try {
    // First delete messages linked to the conversation
    await pool.query("DELETE FROM messages WHERE conversation_id = $1", [
      conversationId,
    ]);

    // Then delete the conversation itself
    await pool.query("DELETE FROM conversations WHERE id = $1", [
      conversationId,
    ]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
