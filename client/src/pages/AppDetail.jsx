import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppScreenshotModal from '../components/AppScreenshotModal';
import { exportScreenshotsToZip } from '../utils/exportScreenshots';
import Tag from '../components/Tag';
import { getPlatformUrl, getCategoryUrl } from '../utils/tagNavigation';
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

  if (loading) return <div className="status">Загрузка...</div>;
  if (error) return <div className="status">Ошибка: {error}</div>;

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
            <div className="app-meta tags-container">
              {/* Platform tags */}
              {app.app_platforms?.map((plat, idx) => {
                const platformLabel = plat.platforms?.label;
                const platformSlug = plat.platforms?.slug || platformLabel?.toLowerCase();
                return (
                  <Tag
                    key={`platform-${idx}`}
                    label={platformLabel}
                    type="platform"
                    href={`/${platformSlug}`}
                    size="medium"
                  />
                );
              })}
              
              {/* Category tags */}
              {app.app_categories?.map((cat, idx) => {
                const categoryLabel = cat.categories?.label;
                const categorySlug = cat.categories?.slug || categoryLabel?.toLowerCase().replace(/\s+/g, '-');
                // Determine platform for category URL
                const platform = app.app_platforms?.[0]?.platforms?.slug ||
                                 app.app_platforms?.[0]?.platforms?.label?.toLowerCase() ||
                                 'web';
                return (
                  <Tag
                    key={`category-${idx}`}
                    label={categoryLabel}
                    type="category"
                    href={`/${platform}/${categorySlug}`}
                    size="medium"
                  />
                );
              })}
              
              {/* Resources tag (if website exists) */}
              {app.website_url && (
                <Tag
                  label="Ссылки"
                  type="resources"
                  isResource={true}
                  size="medium"
                  resourceLinks={[
                    {
                      label: `${app.website_url}`,
                      url: app.website_url,
                      icon: 'globe'
                    }
                  ]}
                />
              )}
            </div>
          </div>
        </div>

        <div className="app-header-right">
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
          appLogo={app.logo_url}
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