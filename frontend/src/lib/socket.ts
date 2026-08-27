import { io, type Socket } from 'socket.io-client'
import { getAccessToken } from '@/api/client'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1'
const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, '')

export type SocketEventName = 'task:created' | 'task:updated' | 'task:deleted' | 'comment:created' | 'comment:deleted'

const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  auth: (cb) => cb({ token: getAccessToken() }),
})

export function connectSocket(): Socket {
  socket.connect()
  return socket
}

export function disconnectSocket() {
  socket.disconnect()
}

export function subscribe<T = unknown>(event: SocketEventName, handler: (payload: T) => void): () => void {
  socket.on(event, handler)
  return () => {
    socket.off(event, handler)
  }
}
