import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './AuthModal.css'

const AuthModal = ({ onClose }) => {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState('email') // 'email', 'otp'
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signInWithOtp } = useAuth()

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setMessage('Введите email')
      return
    }

    setIsLoading(true)
    setMessage('')

    const result = await signInWithOtp(email)
    setIsLoading(false)

    if (result.success) {
      setMessage(`Ссылка для входа отправлена на ${email}. Перейдите по ссылке для подтверждения.`)
      setStep('otp')
    } else {
      setMessage(`Ошибка: ${result.error}`)
    }
  }


  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          ×
        </button>

        <h2 className="auth-modal-title">
          {step === 'email' ? 'Вход / Регистрация' : 'Проверьте вашу почту'}
        </h2>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="auth-form">
            <p className="auth-modal-description">
              Введите ваш email. Мы отправим ссылку для входа.
            </p>
            <input
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? 'Отправка...' : 'Получить код'}
            </button>
          </form>
        ) : (
          <div className="auth-form">
            <p className="auth-modal-description">
              Ссылка для входа отправлена на <strong>{email}</strong>. Перейдите по ссылке в письме для завершения входа.
            </p>
            <div className="auth-modal-actions">
              <button
                type="button"
                className="auth-button-secondary"
                onClick={() => setStep('email')}
                disabled={isLoading}
              >
                Изменить email
              </button>
              <button
                type="button"
                className="auth-button"
                onClick={onClose}
              >
                Закрыть
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className={`auth-message ${message.includes('Ошибка') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="auth-modal-footer">
          <p className="auth-modal-note">
            Нажимая «Получить код», вы соглашаетесь с условиями использования.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthModal