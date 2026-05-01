import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

/**
 * Убедиться, что пользователь существует в таблице public.users
 * @param {object} user - Объект пользователя из Supabase Auth
 */
const ensurePublicUser = async (user) => {
  if (!user) return

  try {
    // Используем upsert для создания или обновления пользователя
    // Это решает проблему race condition и избегает лишних запросов
    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        role: 'user'
      }, {
        onConflict: 'id' // Конфликт по id
      })

    if (error) {
      // Игнорируем ошибку "duplicate key", так как пользователь уже существует
      if (error.code !== '23505') {
        console.error('Ошибка при upsert пользователя в public.users:', error)
      }
    }
  } catch (error) {
    console.error('Ошибка в ensurePublicUser:', error)
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Проверяем текущую сессию при загрузке
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        ensurePublicUser(currentUser)
      }
      setLoading(false)
    })

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        ensurePublicUser(currentUser)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Регистрация по email с OTP
  const signUpWithOtp = async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Вход по email с OTP
  const signInWithOtp = async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Вход по OTP коду (для верификации)
  const verifyOtp = async (email, token) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Выход
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    loading,
    signUpWithOtp,
    signInWithOtp,
    verifyOtp,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}