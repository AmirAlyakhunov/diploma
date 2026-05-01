import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AppDetail from './pages/AppDetail';
import Search from './pages/Search';
import Profile from './pages/Profile';
import NavBar from './components/NavBar';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './contexts/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <NavBar />

        <Routes>
          {/* При заходе на / перенаправляем на /web */}
          <Route path="/" element={<Navigate to="/web" replace />} />
          
          <Route path="/web" element={<Home platformSlug="web" title="Web Apps" />} />
          <Route path="/web/:category" element={<Home platformSlug="web" title="Web Apps" />} />
          <Route path="/ios" element={<Home platformSlug="ios" title="iOS Apps" />} />
          <Route path="/ios/:category" element={<Home platformSlug="ios" title="iOS Apps" />} />
          <Route path="/app/:id" element={<AppDetail />} />
          <Route path="/search" element={<Search />} />
          
          {/* Защищённый маршрут профиля */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;