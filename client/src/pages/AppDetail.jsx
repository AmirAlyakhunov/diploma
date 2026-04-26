import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppScreenshotModal from '../components/AppScreenshotModal';
import { exportScreenshotsToZip } from '../utils/exportScreenshots';
import './AppDetail.css';

const AppDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalIndex, setModalIndex] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  useEffect(() => {
    const fetchApp = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/apps/${id}`);
        if (!response.ok) throw new Error('Failed to fetch app');
        const data = await response.json();
        setApp(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApp();
  }, [id]);

  const handleExport = async () => {
    if (!app?.screenshots?.length) return;
    
    setIsExporting(true);
    setExportError(null);
    
    try {
      await exportScreenshotsToZip(app.screenshots, app.name);
    } catch (error) {
      console.error('Export failed:', error);
      setExportError(error.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return <div className="container">Loading...</div>;
  if (error) return <div className="container">Error: {error}</div>;
  if (!app) return <div className="container">App not found</div>;

  return (
    <div className="container">
      <header className="app-header">
        <div className="app-header-left">
          <button className="back-button" onClick={() => navigate(-1)} aria-label="Назад">
            <span className="material-symbols-rounded">
              arrow_back
            </span>
          </button>
        </div>

        <div className="app-header-center">
          <img src={app.logo_url} alt={app.name} className="app-logo" />
          <div className="app-info">
            <h1>{app.name}</h1>
            <p>{app.description}</p>
            <div className="app-meta">
              {app.app_categories?.map((cat, idx) => (
                <span key={idx} className="app-meta-item">
                  {cat.categories?.label}
                </span>
              ))}
              {app.app_platforms?.map((plat, idx) => (
                <span key={idx} className="app-meta-item">
                  {plat.platforms?.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="app-header-right">
            <a href={app.website_url} target="_blank" rel="noopener noreferrer" className='back-button'>
               <>
                  <span className="material-symbols-rounded">arrow_outward</span>
                </>
            </a>
            <button
              className="export-button"
              onClick={handleExport}
              disabled={isExporting || !app?.screenshots?.length}
              aria-label="Экспортировать скриншоты"
            >
              {isExporting ? (
                <>
                  <span className="export-spinner"></span>
                </>
              ) : (
                <>
                  <span className="material-symbols-rounded">download</span>
                </>
              )}
            </button>
            {exportError && (
              <div className="export-error">
                Ошибка: {exportError}
              </div>
            )}
        </div>
      </header>

      <section className="screenshots-section">
        <div className="screenshots-grid">
          {app.screenshots.map((screenshot, index) => (
            <LazyImage
              key={screenshot.id}
              src={screenshot.image_url}
              alt={`Screenshot ${screenshot.sort_order}`}
              onClick={() => setModalIndex(index)}
            />
          ))}
        </div>
      </section>

      {modalIndex !== null && (
        <AppScreenshotModal
          appName={app.name}
          screenshots={app.screenshots}
          selectedIndex={modalIndex}
          onClose={() => setModalIndex(null)}
        />
      )}
    </div>
  );
};

const LazyImage = ({ src, alt, onClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => setIsLoaded(true);

  return (
    <div className="screenshot-item" ref={imgRef}>
      {isInView ? (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onClick={onClick}
          className={`screenshot-img ${isLoaded ? 'loaded' : ''}`}
          role="button"
          tabIndex={0}
        />
      ) : (
        <div className="screenshot-placeholder">Loading...</div>
      )}
    </div>
  );
};

export default AppDetail;