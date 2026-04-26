import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageUploadModal from './ImageUploadModal';
import SearchModal from './SearchModal';
import './NavBar.css';

const NavBar = () => {
    const [showImageModal, setShowImageModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const navigate = useNavigate();

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

    return (
        <>
            <nav className="navbar">
                <button
                    onClick={() => navigate('/web')}
                    className="navbar-upload-button"
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
                </div>
                <button
                    onClick={() => setShowImageModal(true)}
                    className="navbar-upload-button"
                >
                    <span className="material-symbols-rounded">
                        photo_camera
                    </span>
                </button>

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
            </nav>
        </>
    );
};

export default NavBar;