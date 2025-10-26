import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios' 
const baseURL = '/api'
function Tween(){
    
    const [loading, setLoading] = useState(true)
    const location = useLocation()
    const {repo, data} = location.state || {}
    
    useEffect(() => {
        if (data && data.length > 0) {
            for(const commit of data){
                const description = []
                const author = commit.author.login
                const sha = commit.sha
                const encodedParam = encodeURIComponent(repo);
                axios.get(`${baseURL}/${encodedParam}/9f11659e1ab0e35345072f03253dc0641312948c`)//`${baseURL}/${encodedParam}/${sha}`)
                .then(response => {
                    console.log(response.data)
                }) 
                .catch(error => {
                    console.log('N/A ')
                })
                /*
                axios.get(`https://api.github.com/repos/${repo}/${sha}`)
                .then(response => {
                    description.push()
                    console.log(description)
                }) 
                .catch(error =>{
                    console.log("something went wrong")
                    console.log(error)
                })
                */
                break
            }
        }
    }, [data, repo])
    
    
    console.log(data)
    return <>
    <p>tween service</p>
    <p>your repo name is {repo}</p>
    </>
}

export default Tween