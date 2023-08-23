FROM node:18-alpine

WORKDIR /app

# Copy dependency-list (takes advantage of docker layers)
COPY package*.json ./

# Install dependencies
RUN npm i -g node-gyp
RUN npm i

# TODO: currently we need dev-dependancies (like typescript) installed for our product to work
#       These are not installed when NODE_ENV=production, so we set that ENV later
ENV NODE_ENV production
# Copy remaining parts
COPY . .

RUN chmod +x ./startup.sh

# Run the service
ENTRYPOINT [ "./startup.sh" ]