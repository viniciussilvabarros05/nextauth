
import { createContext, ReactNode, useEffect, useState } from "react";
import { destroyCookie, setCookie, parseCookies } from 'nookies'
import Router from "next/router";
import { api } from "../services/api";
type User = {
    email: string;
    permissions: string[];
    roles: string[];
}
type SignInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn(credentials: SignInCredentials): Promise<void>;
    user: User;
    isAuthenticated: boolean;
}
type AuthProviderProps = {
    children: ReactNode;
}

export function signOut() {
    destroyCookie(undefined, 'nextauth.token')
    destroyCookie(undefined, 'nextauth.refreshToken')
    Router.push('/')
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>()
    const isAuthenticated = !!user

    useEffect(() => {
        //Fazendo chamada a api e pegando token e refreshtoken no browser com cookies. (lib nookies)
        const { 'nextauth.token': token } = parseCookies()

        if (token) {
            api.get('/me').then(response => {
                const { email, permissions, roles } = response.data

                setUser({ email, permissions, roles })

            }).catch(() => {
                signOut()
            })
        }

    }, [])


    async function signIn({ email, password }: SignInCredentials) {

        try {

            //Fazendo chamada a api e salvando jwt e refresh token em cookies

            const response = await api.post('sessions', {
                email, password
            })
            const { token, refreshToken, permissions, roles } = response.data

            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/' //Qualquer endereço da aplicação vai poder ter acesso aos cookies
            })

            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/' //Qualquer endereço da aplicação vai poder ter acesso aos cookies
            })

            //Setando informações de usuário logado

            setUser({
                email,
                permissions,
                roles
            })

            //Definindo Authorization como padrão no headers

            api.defaults.headers['Authorization'] = `Bearer ${token}`

            Router.push('/dashboard')

        } catch (error) {
            console.log(error)
        }

    }

    return (

        <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
            {children}
        </AuthContext.Provider>
    )
}