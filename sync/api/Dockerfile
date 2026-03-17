FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma compatibility and pdftotext for PDF extraction
RUN apk add --no-cache openssl poppler-utils

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

# Use the dev script with tsx for development
CMD ["npm", "run", "dev"]
