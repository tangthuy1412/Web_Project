import { RouterProvider } from 'react-router'
import { useEffect } from 'react'
import { router } from './routes'
import { useAuthStore } from './stores/authStore'

export default function App() {
  const bootstrap = useAuthStore(state => state.bootstrap)

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  return <RouterProvider router={router} />
}
