import { io, type Socket } from 'socket.io-client'
import { SOCKET_URL } from '../../config/api'
import { getToken } from '../apis/apiClient'

let socket: Socket | null = null
let activeToken: string | null = null

export const getChatSocket = () => {
  const token = getToken()

  if (socket && activeToken === token) return socket

  if (socket) {
    socket.disconnect()
    socket = null
  }

  activeToken = token
  socket = io(SOCKET_URL, {
    autoConnect: Boolean(token),
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true
  })

  return socket
}

export const refreshChatSocketAuth = () => {
  const token = getToken()
  const current = getChatSocket()
  current.auth = { token }
  activeToken = token
  if (token && !current.connected) current.connect()
  if (!token && current.connected) current.disconnect()
  return current
}

export const joinChatSession = (sessionId: string) => {
  const current = refreshChatSocketAuth()
  if (!sessionId || !getToken()) return current

  if (!current.connected) current.connect()

  return current
}

export const leaveChatSession = (sessionId: string) => {
  if (!socket || !sessionId) return
  socket.emit('chat:leave', { sessionId })
}

export const emitChatTyping = (sessionId: string, isTyping: boolean) => {
  const current = refreshChatSocketAuth()
  if (sessionId && current.connected) current.emit('chat:typing', { sessionId, isTyping })
}

export const emitChatRead = (sessionId: string) => {
  const current = refreshChatSocketAuth()
  if (sessionId && current.connected) current.emit('chat:read', { sessionId })
}
