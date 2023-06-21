FROM node:18-alpine

WORKDIR /app

# Install global dependency as root
RUN npm i -g node-gyp

USER 1000

# Copy dependency-list (takes advantage of docker layers)
COPY package*.json ./

# Install dependencies
RUN npm i

# Copy remaining parts
COPY . .

RUN chmod +x ./startup.sh

# Run the service
ENTRYPOINT [ "./startup.sh" ]