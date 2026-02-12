FROM node:20-alpine
WORKDIR /work
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["node", "-v"]
