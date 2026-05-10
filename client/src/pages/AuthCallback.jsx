import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './AuthCallback.css'

const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hash = window.location.hash.substring(1)
        if (!hash) {
          console.error('No hash found')
          navigate('/')
          return
        }

        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')

        if (!accessToken || !refreshToken) {
          console.error('Missing tokens')
          navigate('/')
          return
        }

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          console.error('Error setting session:', error)
          navigate('/')
          return
        }

        // Успешно - перенаправляем в профиль
        navigate('/profile')
      } catch (error) {
        console.error('Error in auth callback:', error)
        navigate('/')
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-spinner"></div>
    </div>
  )
}

export default AuthCallback