import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { routerFactory } from './routes';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
export const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' }
});

// stories namespace
const storiesNs = io.of('/stories');
storiesNs.on('connection', (socket) => {
  socket.on('join', (room: string) => {
    socket.join(room);
  });
});

// mount api
app.use('/api', routerFactory(storiesNs));

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});


