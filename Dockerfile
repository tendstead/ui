FROM node:22.22.2-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
FROM dependencies AS dev
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
FROM dependencies AS build
COPY . .
RUN npm run build
FROM node:22.22.2-bookworm-slim AS demo
WORKDIR /app
COPY --from=build /app/demo-dist ./demo-dist
COPY scripts/serve-demo.mjs ./scripts/serve-demo.mjs
USER node
EXPOSE 8080
CMD ["node", "scripts/serve-demo.mjs"]
