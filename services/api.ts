import axios, { AxiosError } from 'axios'
import { parseCookies, setCookie } from 'nookies'
import { signOut } from '../context/AuthContext'

let cookies = parseCookies()
let failedRequestsQueue = []
let isRefreshing = false

export const api = axios.create({
    baseURL: 'http://localhost:3333/',
    headers: {
        Authorization: `Bearer ${cookies['nextauth.token']}`
    }
})

api.interceptors.response.use(response => {
    return response
}, (error: AxiosError) => {
    if (error.response.status === 401) {
        if (error.response.data?.code === 'token.expired') {
            cookies = parseCookies() //atualizando para ter as informações dos cookies mais recentes

            const { 'nextauth.refreshToken': refreshToken } = cookies
            const originalConfig = error.config

            if (!isRefreshing) {
                isRefreshing = true

                api.post('/refresh', {
                    refreshToken,
                }).then(response => {
                    const { token } = response.data

                    setCookie(undefined, 'nextauth.token', token, {
                        maxAge: 60 * 60 * 24 * 30, // 30 days
                        path: '/' //Qualquer endereço da aplicação vai poder ter acesso aos cookies
                    })

                    setCookie(undefined, 'nextauth.refreshToken', response.data.refreshToken, {
                        maxAge: 60 * 60 * 24 * 30, // 30 days
                        path: '/' //Qualquer endereço da aplicação vai poder ter acesso aos cookies
                    })

                    api.defaults.headers['Authorization'] = `Bearer ${token}`
                    failedRequestsQueue.forEach(request => request.onSuccess(token))
                    failedRequestsQueue = []

                }).catch(err => {
                    failedRequestsQueue.forEach(request => request.onFailure(err))
                    failedRequestsQueue = []
                }).finally(() => {
                    isRefreshing = false
                })


            }
            //A função assincrona no axios só é suportada no formato de objeto Promise,( sem await e async )
            return new Promise((resolve, reject) => {
                failedRequestsQueue.push({
                    onSuccess: (token: string) => {
                        originalConfig.headers['Auhorization'] = `Bearer ${token}`
                        resolve(api(originalConfig)) //Aguardando terminar a requisição
                    },
                    onFailure: (error: AxiosError) => {
                        reject(error)
                    }
                })
            })
        } else {
            signOut()
        }
    }
    return Promise.reject(error)
})