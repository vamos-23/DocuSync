#build image using base image
FROM node:18-alpine 
#./api/src -> /app/src
WORKDIR /app
#copy dependencies in package* files
COPY package*.json ./
#install the dependencies into Docker image
RUN npm install
#copy remaining source files
COPY . .
#compiles TypeScript into dist/
RUN npm run build
#use specified port inside container at runtime
EXPOSE 3000
#command to run container server in production
CMD ["node", "dist/index.js"]