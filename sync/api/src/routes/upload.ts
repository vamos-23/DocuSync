/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload and process a PDF synchronously
 *     description: >
 *       Processes PDF inline. ⚠️ Blocks the API thread until complete (10-30s for large files).
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: PDF processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobId:
 *                   type: string
 *                 status:
 *                   type: string
 *                 fileName:
 *                   type: string
 *                 wordCount:
 *                   type: number
 *                 pageCount:
 *                   type: number
 *                 extractedText:
 *                   type: string
 *                 processingTimeMs:
 *                   type: number
 *       400:
 *         description: No file uploaded
 *       503:
 *         description: Timeout — processing took too long
 */

import { Router } from "express";
import multer from "multer";
import { v4 } from "uuid";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import prisma from "../db";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const router = Router();
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./volumes/pdfs";

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("file"), async (req, res) => {
  const start = Date.now();
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const jobId = v4();
    const filePath = path.join(UPLOAD_DIR, `${jobId}.pdf`);

    fs.writeFileSync(filePath, fileBuffer);

    const pdfData = await pdfParse(fileBuffer);
    const extractedText = pdfData.text;
    const wordCount = extractedText.trim().split(/\s+/).filter(Boolean).length;
    const pageCount = pdfData.numpages;
    const metadata = { info: pdfData.info, version: pdfData.version };

    await prisma.job.create({
      data: {
        jobId,
        status: "done",
        filePath,
        fileName,
        extractedText,
        wordCount,
        pageCount,
        metadata,
      },
    });

    const duration = Date.now() - start;
    console.log(`[${jobId}] completed in ${duration}ms`);

    return res.json({
      jobId,
      status: "done",
      fileName,
      wordCount,
      pageCount,
      extractedText: extractedText.slice(0, 500),
      processingTime: duration,
    });
  } catch (error) {
    console.log("File upload failed :", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
