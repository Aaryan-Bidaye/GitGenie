


import { Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Search from './pages/URL'
import Dashboard from './pages/Dashboard'
import UserData from './pages/User'


function App() {
  return (
    <>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/user" element={<UserData />} />
        </Routes>
    </>
  )
}

export default App