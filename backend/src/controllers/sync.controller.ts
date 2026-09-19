import { Request, Response } from "express";
import { SyncRepository } from "../services/sync.repository";

export async function processSyncBatch(req: Request, res: Response) {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files provided" });
  }

  const {batchId, results} = await SyncRepository.syncRepositoryOperations(files);
  
  res.status(200).json({ batchId, pipeline: "sync", results });
};
