import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import { AuthProvider } from '@/lib/auth'
import { ThemeProvider } from '@/lib/theme'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Planning from '@/pages/Planning'
import Board from '@/pages/Board'
import History from '@/pages/History'
import Report from '@/pages/Report'
import Progress from '@/pages/Progress'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/progress/:token?" element={<Progress />} />
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="planning" element={<Planning />} />
            <Route path="board" element={<Board />} />
            <Route path="riwayat" element={<History />} />
            <Route path="laporan" element={<Report />} />
          </Route>
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
