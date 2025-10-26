import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'
import defaultPfp from '../assets/pfp.png'

const baseURL = '/api'

function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { repo } = location.state || {}

  const [topUsers, setTopUsers] = useState([])
  const [users, setUsers] = useState([])
  const [userPFPs, setUserPFPs] = useState(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!repo) return
    const r = repo.split('/').join('@')

    axios.get(`${baseURL}/${r}`)
      .then(response => {
        const commits = response.data
        const userMap = new Map()
        const pfpMap = new Map()

        for (const c of commits) {
          // accumulate user scores
          const prev = userMap.get(c.username) || { name: c.username, score: 0 }
          prev.score += c.impact
          userMap.set(c.username, prev)

          // store avatar
          if (!pfpMap.has(c.username)) {
            pfpMap.set(c.username, c.pfp || defaultPfp)
          }
        }

        const userArray = Array.from(userMap.values())
        const top = [...userArray].sort((a, b) => b.score - a.score)

        setUsers(userArray)
        setTopUsers(top)
        setUserPFPs(pfpMap)
      })
      .catch(err => console.error('Failed to load commits:', err))
      .finally(() => setLoading(false))
  }, [repo])

  if (loading) return <p>Loading...</p>

  return (
    <div className="page-root">
      <header className="topbar">
        <div className="brand" onClick={() => navigate('/')}>GitGenie</div>
      </header>
      <h1><b>{repo}</b></h1>

      {topUsers.length === 0 ? (
        <h3>No users found.</h3>
      ) : (
        <>
          <ol className="hLists leaderboard">
            {topUsers.slice(0, 3).map((u, i) => (
              <li key={u.name} className="leader-card">
                <div className="leader-rank">#{i + 1}</div>
                <img
                  className="pfp"
                  src={userPFPs.get(u.name) || defaultPfp}
                  alt={u.name}
                />
                <div className="leader-info">
                  <div
                    className="name"
                    onClick={() => navigate('/user', { state: { user: u.name } })}
                  >
                    {u.name}
                  </div>
                  <div className="leader-score">Score: {u.score}</div>
                </div>
              </li>
            ))}
          </ol>

          <br />
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.name}>
                  <td className="small-user">
                    <img
                      className="pfp-small"
                      src={userPFPs.get(u.name) || defaultPfp}
                      alt={u.name}
                    />
                    <p
                      className="name"
                      onClick={() => navigate('/user', { state: { user: u.name } })}
                    >
                      {u.name}
                    </p>
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