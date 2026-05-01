import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageUploadModal from './ImageUploadModal';
import SearchModal from './SearchModal';
import AuthModal from './AuthModal';
import { useAuth } from '../contexts/AuthContext';
import './NavBar.css';

const NavBar = () => {
    const [showImageModal, setShowImageModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    const handleImageSearch = async (imageFile) => {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);

            const response = await fetch('/search/image', {
                method: 'POST',
                body: formData,
            });
            const results = await response.json();

            setShowImageModal(false);
            navigate('/search', { state: { imageResults: results } });
        } catch (err) {
            console.error('Image search error:', err);
            alert('Ошибка при поиске изображения');
        }
    };

    const handleAuthClick = () => {
        if (!user) {
            setShowAuthModal(true);
        }
        // Для авторизованных пользователей ничего не делаем - переход на профиль через handleProfileClick
    };

    const handleProfileClick = () => {
        navigate('/profile');
    };

    return (
        <>
            <nav className="navbar">
                <button
                    onClick={() => navigate('/web')}
                    className="navbar-home-button"
                >
                    <span className="material-symbols-rounded">
                        home
                    </span>
                </button>
                <div className="navbar-search-container">
                    <span className="material-symbols-rounded navbar-search-icon">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Найти приложение или скриншот"
                        onClick={() => setShowSearchModal(true)}
                        className="navbar-search-input"
                        readOnly
                    />
                    <button
                        onClick={() => setShowImageModal(true)}
                        className="navbar-upload-button"
                    >
                        <span className="material-symbols-rounded">
                            photo_camera
                        </span>
                    </button>
                </div>

                {/* Кнопка аутентификации */}
                <div className="navbar-auth-section">
                    {user ? (
                        <button
                            onClick={handleProfileClick}
                            className="navbar-profile-button"
                            title="Профиль"
                        >
                            <span className="material-symbols-rounded">
                                person
                            </span>
                        </button>
                    ) : (
                        <button
                            onClick={handleAuthClick}
                            className="navbar-auth-button"
                            title="Войти / Зарегистрироваться"
                        >
                            <span className="material-symbols-rounded navbar-auth-icon">
                                login
                            </span>
                        </button>
                    )}
                </div>

                <ImageUploadModal
                    isOpen={showImageModal}
                    onClose={() => setShowImageModal(false)}
                    onSearch={handleImageSearch}
                />

                <SearchModal
                    show={showSearchModal}
                    onClose={() => setShowSearchModal(false)}
                    onSmartSearch={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
                />

                {showAuthModal && (
                    <AuthModal onClose={() => setShowAuthModal(false)} />
                )}
            </nav>
        </>
    );
};

export default NavBar;