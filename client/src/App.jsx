import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Home from './pages/Home';
import AppDetail from './pages/AppDetail';

function App() {
  return (
    <Router>
      <nav style={{ 
        padding: '20px', 
        borderBottom: '1px solid #eee', 
        display: 'flex', 
        gap: '20px',
        fontWeight: '500'
      }}>
        <Link to="/web">Web</Link>
        <Link to="/ios">iOS</Link>
        <Link to="/android">Android</Link>
      </nav>

      <Routes>
        {/* При заходе на / перенаправляем на /web */}
        <Route path="/" element={<Navigate to="/web" replace />} />
        
        <Route path="/web" element={<Home platformSlug="web" title="Web Apps" />} />
        <Route path="/ios" element={<Home platformSlug="ios" title="iOS Apps" />} />
        <Route path="/android" element={<Home platformSlug="android" title="Android Apps" />} />
        <Route path="/app/:id" element={<AppDetail />} />
      </Routes>
    </Router>
  );
}

export default App;