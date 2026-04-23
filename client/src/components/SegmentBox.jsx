import { Link } from 'react-router-dom';
import SegmentBoxTag from './SegmentBoxTag';
import './SegmentBox.css';

const SegmentBox = ({ activePlatform, categories = [], selectedCategory = null, onCategoryChange }) => {
  const platformTabs = [
    { slug: 'web', label: 'Веб' },
    { slug: 'ios', label: 'iOS' },
  ];

  const allCategory = { slug: null, label: 'Все' };

  const handleCategoryClick = (slug) => {
    if (onCategoryChange) {
      onCategoryChange(slug);
    }
  };

  return (
    <div className="segmentbox-container">
      <div className="segmentbox-tabs">
        {platformTabs.map((tab) => (
          <Link
            key={tab.slug}
            to={`/${tab.slug}`}
            className={`segmentbox-tab ${activePlatform === tab.slug ? 'active' : ''}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="segmentbox-tags-container">
        <div className="segmentbox-tags">
          <SegmentBoxTag
            label={allCategory.label}
            active={selectedCategory === null}
            onClick={() => handleCategoryClick(null)}
          />
          {categories.map((cat) => (
            <SegmentBoxTag
              key={cat.slug}
              label={cat.label}
              active={selectedCategory === cat.slug}
              onClick={() => handleCategoryClick(cat.slug)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SegmentBox;