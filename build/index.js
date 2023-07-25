"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, { /* options */});
io.on("connection", (socket) => {
    socket.on("message", (arg) => {
        console.log(arg);
    });
});
httpServer.listen(3000);
/*
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";


const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  adapter:
    createAdapter(pubClient, subClient)
});

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  io.on("connection", (socket) => {
    console.log(socket);
    socket.on("time", (arg) => {
      console.log(arg); // world
    });
  });

  io.listen(8080);
});
*/
