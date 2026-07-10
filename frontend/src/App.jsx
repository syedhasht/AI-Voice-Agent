import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Layout } from './components/layout'
import { Login, Dashboard, Orders, CreateOrder, OrderDetails, Settings, VoiceSession, Customers, Calls, Analytics, AIAssistant, RAGAssistant, NeedHuman } from './pages'

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/need-human" element={<NeedHuman />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/create-order" element={<CreateOrder />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/calls" element={<Calls />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/rag-assistant" element={<RAGAssistant />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/voice/:order_id" element={<VoiceSession />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
