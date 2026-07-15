import { useEffect } from 'react'
import type {
  ChatMessageCreatedEvent,
  ChatReadUpdatedEvent,
  ChatSessionUpdatedEvent,
  ChatTypingEvent
} from '../types'
import { emitChatRead, joinChatSession, leaveChatSession } from '../services/socket/chatSocket'

const idsMatch = (...values: Array<string | undefined | null>) => {
  const [target, ...candidates] = values
  if (!target) return false
  return candidates.some((value) => Boolean(value) && value === target)
}

const messageSessionId = (event: ChatMessageCreatedEvent) => {
  return event.sessionId || event.message.sessionId
}

const sessionUpdateId = (event: ChatSessionUpdatedEvent | ChatReadUpdatedEvent) => {
  return event.sessionId || event.session._id || event.session.id
}

type UseChatRealtimeOptions<TSession> = {
  sessionId?: string
  onMessageCreated?: (event: ChatMessageCreatedEvent) => void
  onSessionUpdated?: (event: ChatSessionUpdatedEvent) => void
  onReadUpdated?: (event: ChatReadUpdatedEvent) => void
  onTyping?: (event: ChatTypingEvent) => void
  onConnectError?: (message: string) => void
  onDisconnect?: (reason: string) => void
  onReconnect?: () => void
  markRead?: boolean
  sessionIds?: Array<string | undefined | null>
  session?: TSession | null
}

export const useChatRealtime = <TSession,>({
  sessionId,
  onMessageCreated,
  onSessionUpdated,
  onReadUpdated,
  onTyping,
  onConnectError,
  onDisconnect,
  onReconnect,
  markRead = false,
  sessionIds = []
}: UseChatRealtimeOptions<TSession>) => {
  const sessionIdsKey = sessionIds.filter(Boolean).join('|')

  useEffect(() => {
    if (!sessionId) return undefined
    const activeSessionIds = [sessionId, ...sessionIds].filter((value): value is string => Boolean(value))
    const matchesActiveSession = (...candidates: Array<string | undefined | null>) => {
      return activeSessionIds.some((activeId) => idsMatch(activeId, ...candidates))
    }

    const socket = joinChatSession(sessionId)

    const joinCurrentRoom = () => {
      socket.emit('chat:join', { sessionId }, (ack: { success?: boolean; sessionId?: string; error?: unknown }) => {
        if (import.meta.env.DEV) {
          console.debug('chat:join ack', {
            sessionId,
            success: ack?.success,
            ackSessionId: ack?.sessionId,
            error: ack?.error
          })
        }
      })
      if (markRead) emitChatRead(sessionId)
      onReconnect?.()
    }
    const handleMessageCreated = (event: ChatMessageCreatedEvent) => {
      const resolvedSessionId = messageSessionId(event)
      if (matchesActiveSession(resolvedSessionId, event.message.sessionId)) {
        onMessageCreated?.({ ...event, sessionId: resolvedSessionId || sessionId })
      }
    }
    const handleSessionUpdated = (event: ChatSessionUpdatedEvent) => {
      const resolvedSessionId = sessionUpdateId(event)
      if (matchesActiveSession(resolvedSessionId, event.session._id, event.session.id)) {
        onSessionUpdated?.({ ...event, sessionId: resolvedSessionId || sessionId })
      }
    }
    const handleReadUpdated = (event: ChatReadUpdatedEvent) => {
      const resolvedSessionId = sessionUpdateId(event)
      if (matchesActiveSession(resolvedSessionId, event.session._id, event.session.id)) {
        onReadUpdated?.({ ...event, sessionId: resolvedSessionId || sessionId })
      }
    }
    const handleTyping = (event: ChatTypingEvent) => {
      if (matchesActiveSession(event.sessionId)) onTyping?.(event)
    }
    const handleConnectError = (error: Error & { data?: { message?: string } }) => {
      onConnectError?.(error.data?.message ?? error.message)
    }
    const handleDisconnect = (reason: string) => {
      onDisconnect?.(reason)
    }
    const handleConnect = () => {
      if (import.meta.env.DEV) {
        console.debug('chat socket connected', { socketId: socket.id, sessionId })
      }
      joinCurrentRoom()
    }

    socket.on('connect', handleConnect)
    socket.on('chat:message_created', handleMessageCreated)
    socket.on('chat:session_updated', handleSessionUpdated)
    socket.on('chat:read_updated', handleReadUpdated)
    socket.on('chat:typing', handleTyping)
    socket.on('connect_error', handleConnectError)
    socket.on('disconnect', handleDisconnect)

    if (socket.connected) handleConnect()

    return () => {
      leaveChatSession(sessionId)
      socket.off('connect', handleConnect)
      socket.off('chat:message_created', handleMessageCreated)
      socket.off('chat:session_updated', handleSessionUpdated)
      socket.off('chat:read_updated', handleReadUpdated)
      socket.off('chat:typing', handleTyping)
      socket.off('connect_error', handleConnectError)
      socket.off('disconnect', handleDisconnect)
    }
  }, [markRead, onConnectError, onDisconnect, onMessageCreated, onReadUpdated, onReconnect, onSessionUpdated, onTyping, sessionId, sessionIdsKey])
}
