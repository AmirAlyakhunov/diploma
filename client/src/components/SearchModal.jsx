import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchModal.css';

const SearchResultItem = ({ app, onAppSelect, onSmartSearch, query, isSmartSearch }) => {
  const handleClick = () => {
    if (isSmartSearch) {
      onSmartSearch(query);
    } else {
      onAppSelect(app.id);
    }
  };

  return (
    <div className="search-result-item" onClick={handleClick}>
      {isSmartSearch ? (
        <div className="smart-search-icon">🔍</div>
      ) : (
        <img src={app.logo_url} alt={app.name} className="app-avatar" />
      )}
      <div className="result-info">
        <div className="result-name">{isSmartSearch ? 'Умный поиск' : app.name}</div>
        {isSmartSearch && <div className="result-description">Поиск по изображению</div>}
      </div>
    </div>
  );
};

const SearchModal = ({ show, onClose, onSmartSearch }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (show && inputRef.current) {
      inputRef.current.focus();
    }
  }, [show]);

  const searchApps = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/search/apps?query=${encodeURIComponent(searchQuery)}&limit=10`);
      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchApps(query);
    }, 200); // debounce 200ms
    return () => clearTimeout(timeoutId);
  }, [query, searchApps]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="search-modal-backdrop" onClick={handleBackdropClick}>
      <div className="search-modal">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Поиск приложений..."
          className="search-input"
        />
        <div className="search-results">
          {loading ? (
            <div className="loading">Поиск...</div>
          ) : (
            <>
              {results.map((app) => (
                <SearchResultItem
                  key={app.id}
                  app={app}
                  onAppSelect={(id) => { navigate(`/app/${id}`); onClose(); }}
                  onSmartSearch={onSmartSearch}
                  query={query}
                />
              ))}
              {query.trim() && (
                <SearchResultItem
                  isSmartSearch
                  onAppSelect={(id) => { navigate(`/app/${id}`); onClose(); }}
                  onSmartSearch={(searchQuery) => {
                    onClose();
                    onSmartSearch(searchQuery);
                  }}
                  query={query}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;