import express from "express";
import { getDocumentById } from "../services/documentService";

const router = express.Router();

//load document content to editor
router.get('/documents/:documentId/content', async (req, res) => {
  const documentId = req.params.documentId;
  try {
    const documentContent = await getDocumentById(documentId);
    res.json({ content: documentContent });
  } catch (error) {
    console.error("Error fetching document content:", error);
    res.status(500).json({ error: "Failed to fetch document content" });
  }
});

//frontend editor will call this to get logged in user's details
router.get("/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

export = router;