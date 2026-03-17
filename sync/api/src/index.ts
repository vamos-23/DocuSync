import express from "express";
import { swaggerSpec } from "./swagger.js";
import swaggerUI from "swagger-ui-express";
import uploadRoute from "./routes/upload.js";
import resultRoute from "./routes/result.js";

const app = express();

app.use(express.json());

app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerSpec));

app.use((_req, res, next) => {
  res.setTimeout(30000, () => {
    res.status(503).json({
      error: "Request timed-out. Try again later!",
    });
  });
  next();
});

app.use("/upload", uploadRoute);
app.use("/results", resultRoute);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`DocuSync synchronous API running on port ${PORT}`);
});
