import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Transactions from './pages/Transactions'
import Analytics from './pages/Analytics'
import Categories from './pages/Categories'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview"     element={<Overview />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="analytics"    element={<Analytics />} />
        <Route path="categories"   element={<Categories />} />
      </Route>
    </Routes>
  )
}
