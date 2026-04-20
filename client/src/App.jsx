import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home';
import AppDetail from './pages/AppDetail';
import Search from './pages/Search';
import ImageUploadModal from './components/ImageUploadModal';

function NavBar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showImageModal, setShowImageModal] = useState(false)
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleImageSearch = async (imageFile) => {
    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      const response = await fetch('/search/image', {
        method: 'POST',
        body: formData
      })
      const results = await response.json()
      
      setShowImageModal(false)
      navigate('/search', { state: { imageResults: results } })
    } catch (err) {
      console.error('Image search error:', err)
      alert('Ошибка при поиске изображения')
    }
  }

  return (
    <>
      <nav style={{ 
        padding: '20px', 
        borderBottom: '1px solid #eee', 
        display: 'flex', 
        gap: '20px',
        alignItems: 'center',
        fontWeight: '500'
      }}>
        <Link to="/web">Web</Link>
        <Link to="/ios">iOS</Link>
        <Link to="/android">Android</Link>
        
        <button 
          onClick={() => setShowImageModal(true)}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '6px', 
            border: '1px solid #ddd', 
            background: '#fff', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          📷 Поиск по фото
        </button>
        
        <form onSubmit={handleSearch} style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
          />
          <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#0070f3', color: 'white', cursor: 'pointer' }}>
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
  )
}

function App() {
  return (
    <Router>
      <NavBar />

      <Routes>
        {/* При заходе на / перенаправляем на /web */}
        <Route path="/" element={<Navigate to="/web" replace />} />
        
        <Route path="/web" element={<Home platformSlug="web" title="Web Apps" />} />
        <Route path="/ios" element={<Home platformSlug="ios" title="iOS Apps" />} />
        <Route path="/android" element={<Home platformSlug="android" title="Android Apps" />} />
        <Route path="/app/:id" element={<AppDetail />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </Router>
  );
}

export default App;