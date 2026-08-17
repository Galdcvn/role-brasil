FROM node:22-slim
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/

RUN npm ci
RUN cd server && NODE_ENV=development npm install

COPY . .

RUN cd server && DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate && npx nest build
RUN cd server && npm prune --omit=dev

CMD ["sh", "-c", "cd server && node dist/main"]
