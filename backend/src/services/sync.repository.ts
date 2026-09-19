import { eq } from "drizzle-orm";
import { db } from "../db";
import { processingJobs, documentResults } from "../db/schema";
import { v4 as uuidv4 } from "uuid";
import { PdfService } from "./pdf.service";
import { StorageService } from "./storage.service";

export class SyncRepository {
  static async syncRepositoryOperations(files: Express.Multer.File[]) {
    const batchId = uuidv4();
    const results = [];

    for (const file of files) {
      const jobId = uuidv4();
      const filePath = await StorageService.saveFile(jobId, file.buffer);

      try {
        await db.insert(processingJobs).values({
          id: jobId,
          batchId,
          pipeline: "sync",
          status: "processing",
          filePath,
          originalName: file.originalname,
        });

        const { text, wordCount, pageCount } =
          await PdfService.extractPdfData(filePath);
        await db.insert(documentResults).values({
          id: uuidv4(),
          jobId,
          extractedText: text,
          wordCount,
          pageCount,
        });
        await db
          .update(processingJobs)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(processingJobs.id, jobId));
        results.push({ jobId, status: "completed" });
      } catch (error: any) {
        await db
          .update(processingJobs)
          .set({ status: "failed", errorMessage: error.message })
          .where(eq(processingJobs.id, jobId));
        results.push({ jobId, status: "failed" });
      }
    }
    return { batchId, results };
  }
}
