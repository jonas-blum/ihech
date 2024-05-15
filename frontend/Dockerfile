# Build stage
FROM node:21-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build-only

# Production stage
FROM node:21-alpine
WORKDIR /app
COPY --from=builder /app/dist /app/dist
RUN npm install -g serve
EXPOSE 5173
CMD ["serve", "-s", "dist", "-p", "5173"]
