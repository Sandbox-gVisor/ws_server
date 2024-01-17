import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';

import pg from 'pg';
import {Controller} from './controller';


const pgClient = new pg.Client(process.env.POSTGRES_ADDR);
pgClient.connect()

const controller: Controller = new Controller(pgClient, 10);
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
		console.log("Got filter request")
		await controller.applyFilter(data, socket);
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
	await pgClient.query('LISTEN update');

	pgClient.on('notification', async () => {
		await controller.getLength();
		controller.emitLen(io.sockets);
		await controller.emitData(io.sockets);
	});
})();

httpServer.listen(3001, () => {
	console.log('Server is listening on port 3001');
});
