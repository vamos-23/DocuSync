import { integer, text, pgEnum, pgTable, timestamp } from "drizzle-orm/pg-core";

export const pipelineEnum = pgEnum("pipeline", ["sync", "async"]);
export const statusEnum = pgEnum("status", [
  "pending",
  "processing",
  "completed",
  "failed"
]);

export const processingJobs = pgTable("processing_jobs", {
  id: text("id").primaryKey(),
  batchId: text("batch_id").notNull(),
  pipeline: pipelineEnum("pipeline").notNull(),
  status: statusEnum("status").default("pending").notNull(),
  filePath: text("file_path").notNull(),
  originalName: text("original_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
});

export const documentResults = pgTable("document_results", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .references(() => processingJobs.id, { onDelete: "cascade" })
    .notNull(),
  extractedText: text("extracted_text").default("No text found").notNull(),
  wordCount: integer("word_count").notNull(),
  pageCount: integer("page_count").notNull(),
});