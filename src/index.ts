import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';

import {createClient} from 'redis';
import {Controller} from './controller';

const client = createClient({url: process.env.REDIS_ADDR});

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

io.on('connection', async (socket) => {
	await controller.getLength();
	console.log(controller.pageSize, controller.currentLength);
	await controller.Pull();
	await controller.emitData(socket);

	socket.on('filter', async (data) => {
		await controller.setFilter(data);
		await controller.emitData(socket);
	});

	socket.on('set_page', async (data) => {
		await controller.setPageIndex(Number(data));
		await controller.emitData(socket);
	});

	socket.on('set_size', async (data) => {
		await controller.setPageSize(Number(data));
		await controller.emitData(socket);
	});

	socket.on('disconnect', () => {
		controller.filter.applied = false;
		console.log(`Socket ${socket.id} disconnected`);
	});
});

(async () => {
	const subscriber = client.duplicate();
	await subscriber.connect();

	await subscriber.subscribe('update', async () => {
		await controller.getLength();
		controller.emitLen(io.sockets);
		await controller.emitData(io.sockets);
	});
})();

httpServer.listen(3001, () => {
	console.log('Server is listening on port 3001');
});
