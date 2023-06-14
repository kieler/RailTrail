FROM node:18-alpine

# Copy dependency-list (takes advantage of docker layers)
COPY package*.json ./
COPY startup.sh ./

# Install dependencies
RUN npm i -g node-gyp
RUN npm i

# Copy remaining parts
COPY . .

RUN chmod +x startup.sh

# Run the service
ENTRYPOINT [ "./startup.sh" ]