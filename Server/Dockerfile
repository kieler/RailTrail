FROM node:18-alpine AS base

# Copy dependency-list (takes advantage of docker layers)
COPY package*.json ./

# Install dependencies
RUN npm i -g node-gyp
RUN npm i

# Copy remaining parts
COPY . .

# Run the service
FROM base AS prod

ENV NODE_PATH=./build

RUN npm run build
