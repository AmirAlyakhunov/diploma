import { useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUserCollection } from '../utils/collectionUtils'
import AppScreenshotModal from '../components/AppScreenshotModal'
import './Profile.css'

const Profile = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [collection, setCollection] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalIndex, setModalIndex] = useState(null)

  const handleSignOut = async () => {
    const result = await signOut()
    if (result.success) {
      navigate('/')
    }
  }

  // Загрузка коллекции пользователя
  useEffect(() => {
    const loadCollection = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getUserCollection(user.id)
        setCollection(data)
      } catch (error) {
        console.error('Ошибка при загрузке коллекции:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCollection()
  }, [user?.id])

  // Компонент для отображения элемента коллекции - используем классы из Search.jsx
  const CollectionItem = ({ item, index }) => {
    if (!item.imageUrl) return null

    return (
      <div className="search-result-app">
        <div className="search-screenshot-wrapper">
          <div className="screenshot-item" onClick={() => setModalIndex(index)}>
            <img className="screenshot-img loaded" src={item.imageUrl} alt={item.alt || item.appName} />
          </div>
        </div>
        {item.appId ? (
          <Link to={`/app/${item.appId}`} className="search-app-info-row-link">
            <div className="search-app-info-row">
              {item.appLogo && (
                <img src={item.appLogo} alt={`${item.appName} logo`} className="search-app-logo" />
              )}
              <div className="search-app-text-container">
                <h3 className="search-app-name">{item.appName || 'Без названия'}</h3>
                <p className="search-app-desc">{item.appDescription || ''}</p>
              </div>
            </div>
          </Link>
        ) : (
          <div className="search-app-info-row-link">
            <div className="search-app-info-row">
              {item.appLogo && (
                <img src={item.appLogo} alt={`${item.appName} logo`} className="search-app-logo" />
              )}
              <div className="search-app-text-container">
                <h3 className="search-app-name">{item.appName || 'Без названия'}</h3>
                <p className="search-app-desc">{item.appDescription || ''}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container">
      <header className="profile-header">
        <div className="profile-header-center">
            <span className="material-symbols-rounded profile-avatar-icon">
              account_circle
            </span>
          <div className="profile-info">
            <h1 className="profile-email">{user?.email}</h1>
            <div className="profile-meta">
              {collection.length > 0 && (
                <p className="collection-count">
                  {collection.length} {collection.length === 1 ? 'скриншот' :
                    collection.length < 5 ? 'скриншота' : 'скриншотов'} в коллекции
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="profile-header-right">
          <button
            className="signout-button"
            onClick={handleSignOut}
            aria-label="Выйти из аккаунта"
          >
            <span className="material-symbols-rounded">logout</span>
          </button>
        </div>
      </header>

      <section className="profile-content">
        {loading ? (
          <div className="profile-message">
            <p>Загрузка коллекции...</p>
          </div>
        ) : collection.length === 0 ? (
          <div className="profile-message">
            <p>Ваша коллекция пуста. Добавляйте скриншоты в коллекцию, нажимая на ❤️ в модальном окне скриншота.</p>
          </div>
        ) : (
          <div className="search-results-ungrouped">
            {collection.map((item, index) => (
              <CollectionItem key={item.collectionId} item={item} index={index} />
            ))}
          </div>
        )}
      </section>

      {modalIndex !== null && collection[modalIndex] && (
        <AppScreenshotModal
          appName={collection[modalIndex].appName || 'App'}
          screenshots={collection.map(item => ({
            id: item.screenshotId,
            image_url: item.imageUrl,
            apps: item.appId ? {
              id: item.appId,
              name: item.appName,
              logo_url: item.appLogo,
              description: item.appDescription,
            } : null,
          }))}
          selectedIndex={modalIndex}
          onClose={() => setModalIndex(null)}
        />
      )}
    </div>
  )
}

export default Profile