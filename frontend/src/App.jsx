import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import SendPage from './pages/SendPage'
import ReceivePage from './pages/ReceivePage'
import HomePage from './pages/HomePage'
import HistoryPage from './pages/HistoryPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/send" element={<SendPage />} />
        <Route path="/receive" element={<ReceivePage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Layout>
  )
}
