# Server

## Prerequisites

- Docker
- node (including npm)

## Getting started

### MongoDB

I guess a docker container with the MongoDB can be started via:

```docker
docker run -d -p 27017:27017 --name railtraildb -v mongo-data:/data/db mongo:latest
```

This starts a container locally running on port 27017 that listens to the name railtraildb. It is launched with a volume so it probably will be able to store data.

### Start the Server

Remove the `.example` from the `.env.example` filename and in case you haven't started the MongoDB as suggested above, you might need to tweak some of the variables.

Then use a terminal and navigate to the `Server` folder and run

```npm
npm install
```

This should load all the required dependencies.

Now to start the server use

```npm
npm run start
```

This will build and start the server on `localhost:8080`. Whenever some file in the `src` folder is changed, the server will automatically restart.

## Structure

The important stuff is obviously in the folder `src`.
The `controller` folder should include all those files, where the REST-request will be handled. The logics should be in the `services` folder. This will probably also handle the talking with the database etc. . In the `models` folder we can use interfaces to define all those datatypes etc., that we handle.
As far as I know, `index.ts` is the "main"-file (entry point of the application).
