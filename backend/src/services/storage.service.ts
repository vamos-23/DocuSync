import fs, { promises as fsPromises } from "fs";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./volumes/pdfs";
export class StorageService {
  static async saveFile(jobId: string, fileBuffer: Buffer): Promise<string> {
    if (process.env.NODE_ENV === "production") {
      //add code for oracle cloud based solution
      throw new Error("Production storage not yet configured");
    } else {
      if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      }
      const filePath = path.join(UPLOAD_DIR, `${jobId}.pdf`);
      await fsPromises.writeFile(filePath, fileBuffer);
      return filePath;
    }
  }

  static async deleteFile(filePath: string): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      console.log("Simulated deletion from prod DB");
    } else {
      try {
        await fsPromises.unlink(filePath);
      } catch (error: any) {
        if (error.code === "ENOENT") throw error;
      }
    }
  }
}
