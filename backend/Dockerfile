FROM node:20-alpine

WORKDIR /app

# Critical Alpine dependencies for Prisma
RUN apk add --no-cache openssl poppler-utils libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

# Explicitly install ALL dependencies (including devDeps like tsc)
RUN npm install

COPY . .

# Use npx to ensure the local tsc binary is found
RUN npx tsc

EXPOSE 3000

CMD ["npm", "run", "dev"]
