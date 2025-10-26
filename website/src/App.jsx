import { Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Search from './pages/URL'
import Dashboard from './pages/Dashboard'


function App() {
	return (
		<>
			<Routes>
				<Route path="/" element={<Search />} />
				<Route path="/dashboard" element={<Dashboard />} />
			</Routes>
		</>
	)
}

export default App
