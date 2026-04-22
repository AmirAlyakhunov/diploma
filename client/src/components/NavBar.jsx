import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageUploadModal from './ImageUploadModal';
import './NavBar.css';

const NavBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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
          onClick={() => setShowImageModal(true)}
          className="navbar-upload-button"
        >
          📷 Поиск по фото
        </button>

        <form onSubmit={handleSearch} className="navbar-search-form">
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="navbar-search-input"
          />
          <button type="submit" className="navbar-search-button">
            Поиск
          </button>
        </form>
      </nav>

      <ImageUploadModal 
        isOpen={showImageModal} 
        onClose={() => setShowImageModal(false)}
        onSearch={handleImageSearch}
      />
    </>
  );
};

export default NavBar;