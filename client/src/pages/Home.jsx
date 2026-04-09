import { useEffect, useState } from 'react';
import AppCard from '../components/AppCard.jsx';
import './Home.css';

const Home = ({ platformSlug, title }) => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/apps?platform=${platformSlug}`);
        const data = await response.json();
        setApps(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, [platformSlug]);

  return (
    <div className="container">
      <header className="page-header">
        <h1>{title}</h1>
      </header>

      {loading ? (
        <div className="status">Загрузка {title}...</div>
      ) : (
        <div className="apps-grid">
          {apps.length > 0 ? (
            apps.map(app => <AppCard key={app.id} app={app} />)
          ) : (
            <div className="status">Приложений для этой платформы пока нет</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;