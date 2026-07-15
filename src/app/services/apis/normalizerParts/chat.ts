import type { ChatMessage, ChatMode, ChatSenderType, ChatSession } from '../../../types'
import { asArray, asRecord, extractObject, firstString } from './helpers'

const asBoolean = (value: unknown) => {
  return typeof value === 'boolean' ? value : undefined
}

const hasRecordValues = (value: Record<string, unknown>) => {
  return Object.keys(value).length > 0
}

const normalizeSenderType = (message: Record<string, unknown>): ChatSenderType => {
  const senderType = firstString(message.senderType).toUpperCase()
  if (senderType === 'USER' || senderType === 'AI' || senderType === 'ADMIN') return senderType

  const legacy = firstString(message.role, message.sender, message.type, message.author).toLowerCase()
  if (legacy === 'user' || legacy === 'human') return 'USER'
  if (legacy === 'admin' || legacy === 'support') return 'ADMIN'
  return 'AI'
}

const roleFromSenderType = (senderType: ChatSenderType) => {
  return senderType === 'USER' ? 'user' : 'assistant'
}

export const normalizeChatMessage = (payload: unknown): ChatMessage => {
  const message = asRecord(extractObject(payload, ['message', 'reply', 'assistantMessage', 'aiMessage', 'adminMessage', 'userMessage', 'aiResponse', 'response']))
  const senderType = normalizeSenderType(message)
  const createdAt = firstString(message.createdAt, message.timestamp, new Date().toISOString())
  const metadata = asRecord(message.metadata)

  return {
    _id: firstString(message._id) || undefined,
    id: firstString(message.id, message._id, `message-${Date.now()}`),
    senderType,
    role: roleFromSenderType(senderType),
    content: firstString(message.content, message.message, message.text, message.reply, message.response, message.aiResponse),
    createdAt,
    updatedAt: firstString(message.updatedAt) || undefined,
    timestamp: createdAt,
    metadata: hasRecordValues(metadata) ? metadata : undefined
  }
}

export const normalizeChatSession = (payload: unknown): ChatSession => {
  const session = asRecord(extractObject(payload, ['session', 'chatSession']))
  const context = asRecord(session.context)
  const lastMessage = session.lastMessage && typeof session.lastMessage === 'object'
    ? normalizeChatMessage(session.lastMessage)
    : undefined

  return {
    _id: firstString(session._id) || undefined,
    id: firstString(session.id, session._id, session.sessionId),
    title: firstString(session.title, session.name, 'Cuoc tro chuyen moi'),
    status: firstString(session.status) || undefined,
    mode: firstString(session.mode) as ChatMode || undefined,
    modeSource: firstString(session.modeSource) || undefined,
    effectiveMode: firstString(session.effectiveMode) as ChatMode || undefined,
    unreadByUser: asBoolean(session.unreadByUser),
    unreadByAdmin: asBoolean(session.unreadByAdmin),
    lastMessage,
    lastMessageAt: firstString(session.lastMessageAt) || undefined,
    createdAt: firstString(session.createdAt, new Date().toISOString()),
    updatedAt: firstString(session.updatedAt) || undefined,
    messages: asArray(session.messages).map(normalizeChatMessage),
    repositoryContext: firstString(session.repositoryContext) || undefined,
    context: hasRecordValues(context) ? context : undefined
  }
}

export const normalizeChatSessions = (payload: unknown) => {
  return asArray(payload).map(normalizeChatSession)
}

export const normalizeSendMessageResponse = (payload: unknown) => {
  const record = asRecord(payload)
  const data = asRecord(record.data)
  const source = hasRecordValues(data) ? data : record
  const context = asRecord(source.context)

  return {
    mode: firstString(source.mode) as ChatMode || undefined,
    effectiveMode: firstString(source.effectiveMode) as ChatMode || undefined,
    modeSource: firstString(source.modeSource) || undefined,
    status: firstString(source.status) || undefined,
    userMessage: source.userMessage ? normalizeChatMessage(source.userMessage) : null,
    aiMessage: source.aiMessage ? normalizeChatMessage(source.aiMessage) : null,
    adminMessage: source.adminMessage ? normalizeChatMessage(source.adminMessage) : null,
    session: source.session ? normalizeChatSession(source.session) : null,
    context: hasRecordValues(context) ? context : undefined
  }
}
