import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { routerFactory } from './routes';
import { DATA_DIR } from './config';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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


