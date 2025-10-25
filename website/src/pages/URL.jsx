import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import axios from 'axios' 
const baseUrl = '/api'

function getRepoName(url) {
    // Match github.com/{owner}/{repo}, ignoring anything after the repo
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
    return null;
  }
  
function Search() {
    const [URL, setURL] = useState('')
    const navigate = useNavigate()
    const handleURLChange  = (event) => {
      return setURL(event.target.value)
    }
    const parseDirectory = (event) => {
      event.preventDefault()
      console.log('button clicked', event.target)
      const repoName = getRepoName(URL)
      axios.get(`https://api.github.com/repos/${repoName}/commits`)
      .then(response => {
        console.log(response.data);
        navigate('dashboard')
      })
      .catch(error =>{
        console.log("your shit sucks")
        console.log(error)
      })
    }
  
    return (
      <>
      <form onSubmit = {parseDirectory}>
      <input type = "text" onChange = {handleURLChange}/>
      <button type="submit">add</button>
      </form>
      </>
    )
  }
  
export default Search
  