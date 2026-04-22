import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppCard from '../components/AppCard.jsx';
import SearchResult from '../components/SearchResult.jsx';
import SegmentBox from '../components/SegmentBox.jsx';
import './Home.css';

const Home = ({ platformSlug, title }) => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');

  useEffect(() => {
    const fetchApps = async () => {
      setLoading(true);
      try {
        let data;
        
        if (searchQuery) {
          // Поиск по описанию через CLIP
          const response = await fetch('/search/text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: searchQuery })
          });
          data = await response.json();
        } else {
          // Обычная загрузка приложений
          const response = await fetch(`/apps?platform=${platformSlug}`);
          data = await response.json();
        }
        
        setApps(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, [platformSlug, searchQuery]);

  return (
    <div className="container">

      {!searchQuery && <SegmentBox activePlatform={platformSlug} />}

      {loading ? (
        <div className="status">Загрузка...</div>
      ) : (
        <div className="apps-grid">
          {apps.length > 0 ? (
            searchQuery 
              ? apps.map(screenshot => <SearchResult key={screenshot.id} screenshot={screenshot} />)
              : apps.map(app => <AppCard key={app.id} app={app} />)
          ) : (
            <div className="status">
              {searchQuery ? 'Ничего не найдено' : 'Приложений для этой платформы пока нет'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;