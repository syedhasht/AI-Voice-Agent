import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Layout } from './components/layout'
import { Login, Dashboard, Orders, CreateOrder, OrderDetails, Settings, VoiceDemo, VoiceSession } from './pages'

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/create-order" element={<CreateOrder />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/voice-demo" element={<VoiceDemo />} />
          <Route path="/voice/:order_id" element={<VoiceSession />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
