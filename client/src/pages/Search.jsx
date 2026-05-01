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
  const [loadingMore, setLoadingMore] = useState(false);
  const [modalIndex, setModalIndex] = useState(null);
  const [isImageSearch, setIsImageSearch] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const loadMoreRef = useRef();
  const observerRef = useRef();
  
  const query = new URLSearchParams(location.search).get('q');

  // Функция для загрузки результатов поиска
  const loadSearchResults = async (pageNum = 0, isLoadMore = false) => {
    if (!query && !isImageSearch) {
      setResults([]);
      setLoading(false);
      return;
    }
    
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const limit = 20;
      const offset = pageNum * limit;
      
      let response;
      if (isImageSearch && pageNum === 0) {
        // Для поиска по изображению используем уже загруженные результаты из state
        const imageResults = location.state?.imageResults;
        if (imageResults) {
          setResults(imageResults);
          setTotalResults(imageResults.length);
          setHasMore(false);
          // Очищаем state чтобы при обновлении страницы не использовать старые данные
          window.history.replaceState({}, document.title);
          return;
        }
      } else {
        // Текстовый поиск
        response = await fetch('/search/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            limit,
            offset,
            similarity_threshold: 0.47
          })
        });
        
        const data = await response.json();
        
        if (pageNum === 0) {
          // Первая загрузка
          setResults(data.results || []);
          setTotalResults(data.total || 0);
          setHasMore(data.hasMore || false);
        } else {
          // Подгрузка дополнительных результатов
          setResults(prev => [...prev, ...(data.results || [])]);
          setHasMore(data.hasMore || false);
        }
        setPage(pageNum);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Функция для загрузки дополнительных результатов
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadSearchResults(page + 1, true);
    }
  };

  // Настройка IntersectionObserver для бесконечной прокрутки
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore]);

  useEffect(() => {
    // Проверяем, есть ли результаты поиска по изображению в state
    const imageResults = location.state?.imageResults;
    if (imageResults) {
      setResults(imageResults);
      setLoading(false);
      setIsImageSearch(true);
      setTotalResults(imageResults.length);
      setHasMore(false);
      // Очищаем state чтобы при обновлении страницы не использовать старые данные
      window.history.replaceState({}, document.title);
      return;
    }
    
    // Если не image search, сбрасываем флаг
    setIsImageSearch(false);
    
    // Сбрасываем состояние при новом поиске
    setPage(0);
    setResults([]);
    setHasMore(false);
    
    // Выполняем поиск
    if (query) {
      loadSearchResults(0, false);
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [query, location.state]);

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
          <h1 className="search-title">
            {isImageSearch ? (
              <>Результаты поиска <br />по изображению</>
            ) : (
              <>Результаты поиска<br/>«{query}»</>
            )}
          </h1>
        </div>
      </header>

      <section className="screenshots-section">
        {loading ? (
          <div className="status">Поиск...</div>
        ) : results.length > 0 ? (
          <>
            <div className="search-results-ungrouped">
              {results.map((screenshot, index) => (
                <div key={`${screenshot.id}-${index}`} className="search-result-app">
                  <div className="search-screenshot-wrapper">
                    <LazyImage
                      src={screenshot.image_url}
                      alt={screenshot.apps?.name || 'Screenshot'}
                      onClick={() => setModalIndex(index)}
                    />
                  </div>
                  {/* Блок информации о приложении под каждым скриншотом */}
                  <Link to={`/app/${screenshot.apps?.id}`} className="search-app-info-row-link">
                    <div className="search-app-info-row">
                      <img src={screenshot.apps?.logo_url} alt="" className="search-app-logo" />
                      <div className="search-app-text-container">
                        <h3 className="search-app-name">{screenshot.apps?.name || 'Unknown App'}</h3>
                        <p className="search-app-desc">{screenshot.apps?.description || ''}</p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
            
            {/* Индикатор загрузки дополнительных результатов */}
            {loadingMore && (
              <div className="load-more-loading">
                <div className="spinner"></div>
                <span>Загрузка...</span>
              </div>
            )}
            
            {/* Элемент для отслеживания IntersectionObserver */}
            {hasMore && !loadingMore && (
              <div ref={loadMoreRef} className="load-more-sentinel">
                {/* Невидимый элемент для триггера загрузки */}
              </div>
            )}
          </>
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