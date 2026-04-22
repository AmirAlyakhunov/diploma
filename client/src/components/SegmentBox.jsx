import { Link } from 'react-router-dom';
import './SegmentBox.css';

const SegmentBox = ({ activePlatform }) => {
  const tabs = [
    { slug: 'web', label: 'Web Apps' },
    { slug: 'ios', label: 'iOS Apps' },
  ];

  return (
    <div className="segmentbox-container">
      <div className="segmentbox-tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.slug}
            to={`/${tab.slug}`}
            className={`segmentbox-tab ${activePlatform === tab.slug ? 'active' : ''}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SegmentBox;