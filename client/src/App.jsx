import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AppDetail from './pages/AppDetail';
import Search from './pages/Search';
import NavBar from './components/NavBar';

function App() {
  return (
    <Router>
      <NavBar />

      <Routes>
        {/* При заходе на / перенаправляем на /web */}
        <Route path="/" element={<Navigate to="/web" replace />} />
        
        <Route path="/web" element={<Home platformSlug="web" title="Web Apps" />} />
        <Route path="/ios" element={<Home platformSlug="ios" title="iOS Apps" />} />
        <Route path="/app/:id" element={<AppDetail />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </Router>
  );
}

export default App;