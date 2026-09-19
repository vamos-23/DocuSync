import { extractText } from "unpdf";
import fs from "fs";

export class PdfService {
  static async extractPdfData(filePath: string) {
    //to be replaced / updated to Oracle cloud fetch of the file from oracle cloud db via the pre-signed url
    const fileBuffer = fs.readFileSync(filePath);
    const uint8Array = new Uint8Array(fileBuffer);

    const { text, totalPages } = await extractText(uint8Array, {
      mergePages: true,
    });
    const wordCount = text.trim()
      ? text.trim().split(/\s+/).filter(Boolean).length
      : 0;
    return { text, wordCount, pageCount: totalPages };
  }
}
