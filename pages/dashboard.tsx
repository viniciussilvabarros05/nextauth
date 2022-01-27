import { useContext, useEffect } from "react"

import { AuthContext } from "../context/AuthContext"
import { api } from "../services/api"
export default function Dashboard() {
    const { user } = useContext(AuthContext)

    useEffect(()=>{
        api.get('/me').then(response=>{
            console.log(response)
        }).catch((error)=>{
            console.log(error)
        })
    },[])
    
    return (

        <>
            <h1>Dashboard</h1>
            <h2>User: {user?.email}</h2>
        </>

    )
}