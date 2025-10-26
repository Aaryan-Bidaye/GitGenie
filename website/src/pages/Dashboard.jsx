import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'

const baseURL = '/api'






function Dashboard() {
    const [topUsers, setTopUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const location = useLocation()
    const { repo, data } = location.state || {}

    const users = []
    const usersPFP = new Map()
    const userMap = new Map()

    function addOrUpdateUser(name, score) {
        if (userMap.has(name)) {
            userMap.get(name).score += score
        } else {
            const newUser = { name, score }
            users.push(newUser)
            userMap.set(name, newUser)
        }
    }
    
    function getTopUsers(n = 3) {
        return [...users].sort((a, b) => b.score - a.score).slice(0, n)
    }
    useEffect(() => {
        if (!repo) return

        const r = repo.split('/').join('@')

        axios.get(`${baseURL}/${r}`)
            .then(response => {
                const commits = response.data
                for (const c of commits) {
                    // ✅ Use the correct field names
                    addOrUpdateUser(c.username, c.impact)
                }
                const top = getTopUsers()
                console.log('Top users:', top)
                setTopUsers(top)
            })
            .catch(err => {
                console.error('Failed to load commits:', err)
            })
            .finally(() => setLoading(false))
    }, [repo])

    if (loading) return <p>Loading...</p>

    return (
        <>
            <p>Dashboard</p>
            <p>Your repo name is <b>{repo}</b></p>
            {topUsers.length === 0 ? (
                <p>No users found.</p>
            ) : (
                <ul>
                    {topUsers.map((u, i) => (
                        //this will list all 3 users
                        <li key={u.name}>
                            #{i + 1}: {u.name} — Score: {u.score}
                        </li>
                    ))}
                </ul>
            )}
        </>
    )
}

export default Dashboard