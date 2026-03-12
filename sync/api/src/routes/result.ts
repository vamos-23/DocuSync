import { Router } from "express";
import prisma from "../db";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const job = await prisma.job.findUnique({ where: { jobId } });
    if (!job) {
      return res.status(400).json({ error: "No job found" });
    }
    return res.json(job);
  } catch (error) {
    console.log("Result fetch error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
