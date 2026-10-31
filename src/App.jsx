import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthProvider from './context/AuthProvider'
import ToastProvider from './context/ToastProvider'
import { useAuth } from './context/hooks'
import Layout from './components/Layout'
import { Loading } from './components/States'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Generator from './pages/Generator'
import LibraryPage from './pages/Library'
import Bulk from './pages/Bulk'
import Voices from './pages/Voices'

function Protected() {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return user ? <Layout /> : <Navigate to="/login" replace />
}

function LoginRoute() {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  return user ? <Navigate to="/" replace /> : <Login />
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route element={<Protected />}>
              <Route index element={<Dashboard />} />
              <Route path="generate" element={<Generator />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="bulk" element={<Bulk />} />
              <Route path="voices" element={<Voices />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}
