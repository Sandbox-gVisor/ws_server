import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { createClient } from "redis";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`Socket ${socket.id} connected`);

  socket.on('message', (data) => {
    console.log(`Received message: ${data}`);
    socket.send("no sex");
  });

  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
  });
});


(async () => {

  const client = createClient();

  const subscriber = client.duplicate();

  await subscriber.connect();

  await subscriber.subscribe('update', (message) => {
    console.log(message); // 'message'
    const sockets = io.sockets.fetchSockets()
    for (let socket in sockets) {
      console.log(socket);
    }
    io.sockets.send(message);
  });

})();

httpServer.listen(3001, () => {
  console.log('Server is listening on port 3001');
});
