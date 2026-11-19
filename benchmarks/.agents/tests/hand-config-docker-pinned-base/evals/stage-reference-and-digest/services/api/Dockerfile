FROM node:22.11-alpine AS build
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM build AS test
RUN npm test

FROM gcr.io/distroless/nodejs22-debian12@sha256:3d6f1c0e8b2a49b7d5c1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9
COPY --from=build /app/dist /app
CMD ["/app/index.js"]
