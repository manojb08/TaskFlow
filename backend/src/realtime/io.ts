import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env';
import { verifyAccessToken } from '../utils/jwt';

let io: SocketIOServer | undefined;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      verifyAccessToken(token);
      next();
    } catch {
      next(new Error('Invalid or expired access token'));
    }
  });

  return io;
}

export function getIO(): SocketIOServer | undefined {
  return io;
}

export function broadcast(event: string, payload: unknown): void {
  io?.emit(event, payload);
}
