import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import AppCard from '../components/AppCard.jsx';
import SearchResult from '../components/SearchResult.jsx';
import SegmentBox from '../components/SegmentBox.jsx';
import './Home.css';

const Home = ({ platformSlug, title }) => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [categories, setCategories] = useState([]);
  const [searchParams] = useSearchParams();
  const { category: urlCategory } = useParams();
  const searchQuery = searchParams.get('search');
  const sentinelRef = useRef();
  const navigate = useNavigate();

  const limit = 20; // Количество приложений на страницу

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

  const fetchApps = useCallback(async (pageNum = 0, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      let url;
      if (searchQuery) {
        // Поиск по описанию через CLIP
        url = '/search/text';
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery, limit, offset: pageNum * limit })
        });
        const data = await response.json();
        if (append) {
          setApps(prev => [...prev, ...data]);
        } else {
          setApps(data);
        }
        setHasMore(data.length === limit);
      } else {
        // Обычная загрузка приложений
        url = `/apps?platform=${platformSlug}&limit=${limit}&offset=${pageNum * limit}${urlCategory ? `&category=${urlCategory}` : ''}`;
        const response = await fetch(url);
        const data = await response.json();
        if (append) {
          setApps(prev => [...prev, ...data]);
        } else {
          setApps(data);
        }
        setHasMore(data.length === limit);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, [platformSlug, searchQuery, urlCategory, limit]);

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchApps(0, false);
  }, [platformSlug, searchQuery, urlCategory, fetchApps]);

  const handleCategoryChange = (slug) => {
    if (slug) {
      navigate(`/${platformSlug}/${slug}`);
    } else {
      navigate(`/${platformSlug}`);
    }
  };

  const observerRef = useRef();

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    if (!sentinelRef.current || loading || loadingMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPage(prev => {
            const newPage = prev + 1;
            fetchApps(newPage, true);
            return newPage;
          });
        }
      },
      { threshold: 1.0 }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loading, loadingMore, hasMore, fetchApps]);

  return (
    <div className="home-container">

      {!searchQuery && (
        <SegmentBox
          activePlatform={platformSlug}
          categories={categories}
          selectedCategory={urlCategory}
          onCategoryChange={handleCategoryChange}
        />
      )}

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
          {hasMore && !loadingMore && <div ref={sentinelRef} className="sentinel"></div>}
          {loadingMore && <div className="status">Загрузка ещё...</div>}
        </div>
      )}
    </div>
  );
};

export default Home;