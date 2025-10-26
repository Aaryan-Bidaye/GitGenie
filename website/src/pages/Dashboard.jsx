import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
// import axios from 'axios'
import pfp from '../assets/pfp.png'

const baseURL = '/api'






function Dashboard() {
    const [topUsers, setTopUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState([])
    const location = useLocation()
    const { repo, data } = location.state || {}

    //const users = []
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
        // Mock mode: comment out backend calls and use temporary data
        // if (!repo) return
        // const r = repo.split('/').join('@')
        // axios.get(`${baseURL}/${r}`)
        //     .then(response => {
        //         const commits = response.data
        //         for (const c of commits) {
        //             addOrUpdateUser(c.username, c.impact)
        //         }
        //         const top = getTopUsers()
        //         setTopUsers(top)
        //     })
        //     .catch(err => {
        //         console.error('Failed to load commits:', err)
        //     })
        //     .finally(() => setLoading(false))

        const mockTopUsers = [
            { name: 'alice', score: 128 },
            { name: 'bob', score: 97 },
            { name: 'charlie', score: 75 },
        ]

        const mockUsers = [
            { name: 'dave', score: 60 },
            { name: 'eve', score: 55 },
            { name: 'frank', score: 50 },
            { name: 'grace', score: 45 },
            { name: 'ivy', score: 35 },
            { name: 'jake', score: 30 },
            { name: 'kate', score: 25 },
            { name: 'nancy', score: 10 },
            { name: 'olivia', score: 5 },
        ]

        setTopUsers(mockTopUsers)
        setUsers(mockUsers)
        setLoading(false)
    }, [repo])

    if (loading) return <p>Loading...</p>

    return (
        <div className="page-root">
            <header className="topbar">
                <div className="brand" onClick={()=>console.log("Home")}>GitGenie</div>
            </header>
            <h1>Astronomy Data Repo</h1>
            <h3>Owner: SmartyMcSmartyPants <b>{repo}</b></h3>
            <h3>Misc Data</h3>
            {topUsers.length === 0 ? (
                <h3>No users found.</h3>
            ) : (
                <>
                
                <ol className="hLists leaderboard">
                    {topUsers.map((u, i) => (
                        <li key={u.name} className="leader-card">
                            <div className="leader-rank">#{i + 1}</div>
                            <img className="pfp" src={pfp} alt={u.name} />
                            <div className="leader-info">
                                <div className="name">{u.name}</div>
                                <div className="leader-score">Score: {u.score}</div>
                            </div>
                        </li>
                    ))}
                </ol>
                <br/>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u, i) => (
                            <tr key={u.name}>
                                <td className="small-user">
                                    <img className="pfp-small" src={pfp} alt={u.name} />
                                    <text className="name"> {u.name} </text>
                                </td>
                                <td>{u.score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </>
            )}  
        </div>
    )
}

export default Dashboard