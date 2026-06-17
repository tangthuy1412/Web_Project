import type { User } from '../types'

export const getDefaultAuthenticatedPath = (user?: User | null) => {
  return user?.role === 'admin' ? '/admin' : '/dashboard'
}
