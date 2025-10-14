// frontend/src/contexts/AuthContext.js

// Firebase temporariamente desabilitado - usando mock
// import { onAuthStateChanged } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
// import { auth, logOut, signInWithGoogle } from "../firebase";

const AuthContext = createContext();
export function useAuth() {
        return useContext(AuthContext);
}

export function AuthProvider({ children }) {
        const [firebaseUser, setFirebaseUser] = useState(null);
        const [backendUser, setBackendUser] = useState(null);
        const [loading, setLoading] = useState(true);

        const API_URL = `${process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8001"}/api`;

        useEffect(() => {
                // Mock user para desenvolvimento - substitui Firebase
                const mockUser = {
                        uid: "mock-user-123",
                        email: "user@test.com",
                        displayName: "Test User",
                        photoURL: null
                };
                
                setFirebaseUser(mockUser);
                if (typeof window !== "undefined") window.__user = mockUser;
                // Adiciona interceptor para incluir user_id em todas as requisições
                const interceptor = api.interceptors.request.use((config) => {
                        config.headers.Authorization = `Bearer ${mockUser.uid}`;
                        return config;
                });

                // Criar/buscar usuário no backend
                const initUser = async () => {
                        try {
                                const res = await fetch(`${API_URL}/users`, {
                                        method: "POST",
                                        headers: {
                                                "Content-Type": "application/json",
                                                "X-User-ID": mockUser.uid,
                                        },
                                        body: JSON.stringify({
                                                email: mockUser.email,
                                                name: mockUser.displayName,
                                                photo: mockUser.photoURL || "",
                                        }),
                                });
                                if (!res.ok) throw new Error(`POST /users ${res.status}`);
                                setBackendUser(await res.json());
                        } catch (err) {
                                console.error("Erro ao criar/buscar usuário no backend:", err);
                                setBackendUser(null);
                        }
                        setLoading(false);
                };

                initUser();

                return () => {
                        api.interceptors.request.eject(interceptor);
                };
        }, [API_URL]);

        const login = async () => {
                // Mock login - já está logado automaticamente
                console.log("Mock login - usuário já autenticado");
        };
        const logout = async () => {
                // Mock logout - recarrega a página para simular logout
                setFirebaseUser(null);
                setBackendUser(null);
                if (typeof window !== "undefined") {
                        window.__user = null;
                        window.location.reload();
                }
        };

        const value = {
                firebaseUser,
                backendUser,
                loading,
                login,
                logout,
                isAuthenticated: !!firebaseUser, // libera o app assim que o Firebase loga
        };

        return (
                <AuthContext.Provider value={value}>
                        {!loading && children}
                </AuthContext.Provider>
        );
}
