import swaggerJSDoc, { Options } from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "DocuSync Synchronous API",
      description: "Synchronous PDF processing API",
    },
    servers: [{ url: "https://localhost:3000" }],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
