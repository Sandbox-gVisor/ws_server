import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { createClient } from 'redis';
import { Controller } from './controller';

const client = createClient();

client.on('error', (err) => console.log('Redis Client Error', err));
const fetchClient = async () => {
  await client.connect();
};
fetchClient().catch(console.error);

const controller: Controller = new Controller(client, 3);
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`Socket ${socket.id} connected`);

  socket.on('set_page', (data) => {
    controller.setPageIndex(Number(data));
    for (let log of controller.logs) {
      socket.emit('message', log);
    }
  });

  socket.on('set_size', (data) => {
    controller.setPageSize(Number(data));
    for (let log of controller.logs) {
      socket.emit('message', log);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
  });
});

(async () => {
  const subscriber = client.duplicate();
  await subscriber.connect();

  await subscriber.subscribe('update', (message) => {
    console.log(message); // 'message'
    const sockets = io.sockets.fetchSockets();
    for (let socket in sockets) {
      console.log(socket);
    }

    controller.pull();
  });
})();

httpServer.listen(3001, () => {
  console.log('Server is listening on port 3001');
});
