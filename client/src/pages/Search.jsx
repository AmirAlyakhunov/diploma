import { useEffect, useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
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

  // Группируем скриншоты по приложению
  const groupedByApp = results.reduce((acc, screenshot) => {
    const appId = screenshot.apps?.id;
    if (!appId) return acc;
    if (!acc[appId]) {
      acc[appId] = {
        app: screenshot.apps,
        screenshots: []
      };
    }
    acc[appId].screenshots.push(screenshot);
    return acc;
  }, {});

  // Преобразуем в массив и сортируем по максимальному сходству (чтобы самые релевантные приложения были выше)
  const groupedArray = Object.values(groupedByApp).map(group => ({
    ...group,
    maxSimilarity: Math.max(...group.screenshots.map(s => s.similarity))
  })).sort((a, b) => b.maxSimilarity - a.maxSimilarity);

  return (
    <div className="container">
      <header className="search-header">
        <div className="search-header-left">
          <button className="back-button" onClick={() => navigate(-1)} aria-label="Назад">
            <span className="material-symbols-rounded">
              arrow_back
            </span>
          </button>
        </div>

        <div className="search-header-center">
          <h1 className="search-title">Результаты поиска<br></br>«{query}»</h1>
        </div>

        <div className="search-header-right">
          {/* Optional right side content */}
        </div>
      </header>

      <section className="screenshots-section">
        {loading ? (
          <div className="status">Поиск...</div>
        ) : results.length > 0 ? (
          <div className="search-results-grouped">
            {groupedArray.map((group) => (
              <div key={group.app.id} className="app-group">
                {/* Блок приложения (ссылка) */}
                <Link to={`/app/${group.app.id}`} className="search-app-info-row-link">
                  <div className="search-app-info-row">
                    <img src={group.app.logo_url} alt="" className="search-app-logo" />
                    <div className="search-app-text-container">
                      <h3 className="search-app-name">{group.app.name}</h3>
                      <p className="search-app-desc">{group.app.description || ''}</p>
                    </div>
                  </div>
                </Link>

                {/* Сетка скриншотов этого приложения */}
                <div className="app-screenshots-grid">
                  {group.screenshots.map((screenshot) => {
                    const globalIndex = results.findIndex(s => s.id === screenshot.id);
                    return (
                      <div key={screenshot.id} className="search-screenshot-wrapper">
                        <LazyImage
                          src={screenshot.image_url}
                          alt={screenshot.apps?.name || 'Screenshot'}
                          onClick={() => setModalIndex(globalIndex)}
                        />
                        {/* Убрали блок с similarity и ссылкой */}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="status">Ничего не найдено</div>
        )}
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