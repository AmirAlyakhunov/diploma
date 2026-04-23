import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppCard from '../components/AppCard.jsx';
import SearchResult from '../components/SearchResult.jsx';
import SegmentBox from '../components/SegmentBox.jsx';
import './Home.css';

const Home = ({ platformSlug, title }) => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/categories');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

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

  const handleCategoryChange = (slug) => {
    setSelectedCategory(slug);
  };

  // Filter apps by selected category (only when not searching)
  const filteredApps = searchQuery
    ? apps
    : selectedCategory
    ? apps.filter(app =>
        app.app_categories?.some(ac => ac.categories?.slug === selectedCategory)
      )
    : apps;

  return (
    <div className="home-container">

      {!searchQuery && (
        <SegmentBox
          activePlatform={platformSlug}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      )}

      {loading ? (
        <div className="status">Загрузка...</div>
      ) : (
        <div className="apps-grid">
          {filteredApps.length > 0 ? (
            searchQuery
              ? filteredApps.map(screenshot => <SearchResult key={screenshot.id} screenshot={screenshot} />)
              : filteredApps.map(app => <AppCard key={app.id} app={app} />)
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