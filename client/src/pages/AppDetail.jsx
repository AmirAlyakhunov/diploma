import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import AppScreenshotModal from '../components/AppScreenshotModal';
import './AppDetail.css';

const AppDetail = () => {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalIndex, setModalIndex] = useState(null);

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

  if (loading) return <div className="container">Loading...</div>;
  if (error) return <div className="container">Error: {error}</div>;
  if (!app) return <div className="container">App not found</div>;

  return (
    <div className="container">
      <header className="app-header">
        <img src={app.logo_url} alt={app.name} className="app-logo" />
        <div className="app-info">
          <h1>{app.name}</h1>
          <p>{app.description}</p>
          {app.website_url && (
            <a href={app.website_url} target="_blank" rel="noopener noreferrer">
              Visit Website
            </a>
          )}
        </div>
      </header>

      <section className="screenshots-section">
        <h2>Screenshots</h2>
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