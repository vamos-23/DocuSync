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
 *                 info:
 *                   type: object
 *                   additionalProperties: true
 *                   description: "Dictionary of PDF metadata fields like Author, Title Creator"
 *                 processingTime:
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
import { extractText, getMeta } from "unpdf";
import prisma from "../db";

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
      const { text, totalPages } = await extractText(
        new Uint8Array(fileBuffer),
        {
          mergePages: true,
        },
      );
      // Word count
      const wordCount = text.trim()
        ? text.trim().split(/\s+/).filter(Boolean).length
        : 0;
      // Metadata about PDF
      const metadata = await getMeta(new Uint8Array(fileBuffer));

      await prisma.job.create({
        data: {
          jobId,
          status: "done",
          filePath,
          fileName,
          extractedText: text,
          wordCount,
          pageCount: totalPages,
          metadata: JSON.parse(JSON.stringify(metadata)),
        },
      });

      const duration = Date.now() - start;
      console.log(`[${jobId}] completed in ${duration}ms`);

      return res.json({
        jobId,
        status: "done", //mark as done as processing is synchronous
        fileName,
        wordCount,
        pageCount: totalPages,
        extractedText: text.length > 2000 ? text.slice(0, 2000) : text,
        info: metadata.info,
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
