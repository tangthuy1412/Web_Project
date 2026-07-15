import type { ChatContext, ChatMessage, ChatMode, ChatSenderType, ChatSession } from '../../../types'
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

const asNumber = (value: unknown) => {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

const asStringArray = (value: unknown) => {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : undefined
}

const normalizeChatContext = (payload: unknown): ChatContext | undefined => {
  const source = asRecord(payload)
  const context: ChatContext = {
    repositoryId: firstString(source.repositoryId) || undefined,
    repoName: firstString(source.repoName, source.repositoryName, source.fullName) || undefined,
    roadmapId: firstString(source.roadmapId) || undefined,
    analysisId: firstString(source.analysisId) || undefined,
    snapshotId: firstString(source.snapshotId) || undefined,
    progressUpdatedAt: firstString(source.progressUpdatedAt) || undefined,
    analysisSource: firstString(source.analysisSource) || undefined,
    contextSelectionReason: firstString(source.contextSelectionReason) || undefined,
    contextPinned: asBoolean(source.contextPinned),
    intent: firstString(source.intent) || undefined,
    intents: asStringArray(source.intents),
    hasRoadmapContext: asBoolean(source.hasRoadmapContext),
    hasComparisonContext: asBoolean(source.hasComparisonContext),
    comparedRepoCount: asNumber(source.comparedRepoCount)
  }

  return Object.values(context).some((value) => value !== undefined) ? context : undefined
}

export const normalizeChatMessage = (payload: unknown): ChatMessage => {
  const message = asRecord(extractObject(payload, ['message', 'reply', 'assistantMessage', 'aiMessage', 'adminMessage', 'userMessage', 'aiResponse', 'response']))
  const senderType = normalizeSenderType(message)
  const createdAt = firstString(message.createdAt, message.timestamp, new Date().toISOString())
  const metadata = asRecord(message.metadata)

  return {
    _id: firstString(message._id) || undefined,
    id: firstString(message.id, message._id, `message-${Date.now()}`),
    sessionId: firstString(message.sessionId) || undefined,
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
  const context = normalizeChatContext(session.context)
  const lastMessage = session.lastMessage && typeof session.lastMessage === 'object'
    ? normalizeChatMessage(session.lastMessage)
    : undefined

  return {
    _id: firstString(session._id) || undefined,
    id: firstString(session.id, session._id, session.sessionId),
    title: firstString(session.title, session.name, 'Cuoc tro chuyen moi'),
    repositoryId: firstString(session.repositoryId) || context?.repositoryId,
    roadmapId: firstString(session.roadmapId) || context?.roadmapId,
    analysisId: firstString(session.analysisId) || context?.analysisId,
    snapshotId: firstString(session.snapshotId) || context?.snapshotId,
    contextSelectionReason: firstString(session.contextSelectionReason) || context?.contextSelectionReason,
    contextPinnedAt: firstString(session.contextPinnedAt) || undefined,
    status: firstString(session.status) || undefined,
    closedAt: firstString(session.closedAt) || undefined,
    closedBy: firstString(session.closedBy) || undefined,
    closeReason: firstString(session.closeReason) || undefined,
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
    context
  }
}

export const normalizeChatSessions = (payload: unknown) => {
  return asArray(payload).map(normalizeChatSession)
}

export const normalizeSendMessageResponse = (payload: unknown) => {
  const record = asRecord(payload)
  const data = asRecord(record.data)
  const source = hasRecordValues(data) ? data : record
  const context = normalizeChatContext(source.context) ?? normalizeChatContext(record.context) ?? normalizeChatContext(data.context)

  return {
    mode: firstString(source.mode) as ChatMode || undefined,
    effectiveMode: firstString(source.effectiveMode) as ChatMode || undefined,
    modeSource: firstString(source.modeSource) || undefined,
    status: firstString(source.status) || undefined,
    userMessage: source.userMessage ? normalizeChatMessage(source.userMessage) : null,
    aiMessage: source.aiMessage ? normalizeChatMessage(source.aiMessage) : null,
    adminMessage: source.adminMessage ? normalizeChatMessage(source.adminMessage) : null,
    session: source.session ? normalizeChatSession(source.session) : null,
    context
  }
}
