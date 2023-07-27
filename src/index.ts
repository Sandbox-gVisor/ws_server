import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { createClient } from 'redis';
import { Controller } from './controller';

const client = createClient({ url: 'redis://redis:6379' });

client.on('error', (err) => console.log('Redis Client Error', err));
const fetchClient = async () => {
  await client.connect();
};
fetchClient().catch(console.error);

const controller: Controller = new Controller(client, 10);
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  controller.pull();
  socket.emit('length', controller.len);
  controller.emitData(socket);

  socket.on('set_page', (data) => {
    controller.setPageIndex(Number(data));
    controller.emitData(socket);
  });

  socket.on('set_size', (data) => {
    controller.setPageSize(Number(data));
    controller.emitData(socket);
  });

  socket.on('disconnect', () => {
    console.log(`Socket ${socket.id} disconnected`);
  });
});

(async () => {
  const subscriber = client.duplicate();
  await subscriber.connect();

  await subscriber.subscribe('update', () => {
    controller.pull();
    io.sockets.emit("length", controller.len);
  });
})();

httpServer.listen(3001, () => {
  console.log('Server is listening on port 3001');
});
