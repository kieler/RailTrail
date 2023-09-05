FROM node:18-alpine AS build-stage

WORKDIR /app

# Copy dependency-list (takes advantage of docker layers)
COPY package*.json ./

# Install dependencies
RUN npm i -g node-gyp
RUN npm i

# Copy remaining parts
COPY . .

# Generate prisma files
RUN npx prisma generate

# Build the TypeScript application
RUN npm run build

FROM node:18-alpine AS base

WORKDIR /app

# Copy only the built files from the previous stage
COPY --from=build-stage /app/build ./build
COPY --from=build-stage /app/package.json ./
COPY --from=build-stage /app/prisma/schema.prisma ./
COPY --from=build-stage /app/node_modules ./node_modules
ENV NODE_ENV production

FROM base AS production-stage
CMD ["npm", "start"]