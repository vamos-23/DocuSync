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
import { exec } from "child_process";
import { promisify } from "util";
import prisma from "../db";

const execAsync = promisify(exec);
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

    try {
      // Extract text
      const { stdout: extractedText } = await execAsync(`pdftotext -enc UTF-8 "${filePath}" -`);
      
      // Get page count
      const { stdout: infoOutput } = await execAsync(`pdfinfo "${filePath}"`);
      const pageMatch = infoOutput.match(/Pages:\s*(\d+)/);
      const pageCount = pageMatch ? parseInt(pageMatch[1], 10) : 0;
      
      const wordCount = extractedText.trim().split(/\s+/).filter(Boolean).length;
      const metadata = { pageCount };

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
        extractedText: extractedText.slice(0, 1000),
        processingTime: duration,
      });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.log("File upload failed :", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
