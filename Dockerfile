FROM node:22-slim
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/

RUN npm ci
RUN cd server && NODE_ENV=development npm install

COPY . .

RUN cd server && npx prisma generate && npx nest build
RUN cd server && npm prune --omit=dev

CMD ["sh", "-c", "cd server && node dist/main"]
