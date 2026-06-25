import { asArray, asRecord } from './helpers'

export * from './analysis'
export * from './chat'
export * from './helpers'
export * from './repository'
export * from './user'

const unwrapData = (payload: unknown) => {
  const record = asRecord(payload)
  return record.data && typeof record.data === 'object' ? record.data : payload
}

export const normalizeFiles = (payload: unknown) => {
  const source = asRecord(unwrapData(payload))
  const packageAnalysis = asRecord(source.packageAnalysis ?? payload)

  if (
    Array.isArray(packageAnalysis.packageFiles) ||
    Array.isArray(packageAnalysis.packages) ||
    Array.isArray(packageAnalysis.frameworks) ||
    Array.isArray(packageAnalysis.detectedFiles)
  ) {
    return [packageAnalysis]
  }

  return asArray(unwrapData(payload))
}

export const normalizeCommits = (payload: unknown) => {
  const source = asRecord(unwrapData(payload))
  return Array.isArray(source.commits) ? source.commits : asArray(unwrapData(payload))
}
