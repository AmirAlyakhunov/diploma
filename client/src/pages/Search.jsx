import { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import AppScreenshotModal from '../components/AppScreenshotModal';
import './Search.css';

const LazyImage = ({ src, alt, onClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="screenshot-item" ref={imgRef}>
      {isInView ? (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onClick={onClick}
          className={`screenshot-img${isLoaded ? ' loaded' : ''}`}
          role="button"
          tabIndex={0}
        />
      ) : (
        <div className="screenshot-placeholder">Loading...</div>
      )}
    </div>
  );
};

const Search = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalIndex, setModalIndex] = useState(null);
  const location = useLocation();
  
  const query = new URLSearchParams(location.search).get('q');

  useEffect(() => {
    // Проверяем, есть ли результаты поиска по изображению в state
    const imageResults = location.state?.imageResults;
    if (imageResults) {
      setResults(imageResults);
      setLoading(false);
      // Очищаем state чтобы при обновлении страницы не использовать старые данные
      window.history.replaceState({}, document.title);
      return;
    }

    const doSearch = async () => {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const response = await fetch('/search/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        const data = await response.json();
        setResults(data);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };

    doSearch();
  }, [query, location.state]);

  return (
    <div className="container">
      <header className="page-header">
        <h1>Результаты поиска: "{query}"</h1>
      </header>

      <section className="screenshots-section">
        <h2>Screenshots</h2>
        <div className="screenshots-grid">
          {loading ? (
            <div className="status">Поиск...</div>
          ) : results.length > 0 ? (
            results.map((screenshot, index) => (
              <div key={screenshot.id} className="search-screenshot-wrapper">
                <LazyImage
                  src={screenshot.image_url}
                  alt={screenshot.apps?.name || 'Screenshot'}
                  onClick={() => setModalIndex(index)}
                />
                <div className="search-screenshot-info">
                  <Link to={`/app/${screenshot.apps?.id}`} className="search-app-link">
                    {screenshot.apps?.name}
                  </Link>
                  <span className="search-similarity">
                    Сходство: {Math.round(screenshot.similarity * 100)}%
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="status">Ничего не найдено</div>
          )}
        </div>
      </section>

      {modalIndex !== null && results[modalIndex] && (
        <AppScreenshotModal
          appName={results[modalIndex].apps?.name || 'App'}
          screenshots={results}
          selectedIndex={modalIndex}
          onClose={() => setModalIndex(null)}
        />
      )}
    </div>
  );
};

export default Search;