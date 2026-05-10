import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AppDetail from './pages/AppDetail';
import Search from './pages/Search';
import Profile from './pages/Profile';
import AuthCallback from './pages/AuthCallback';
import NotFound from './pages/NotFound';
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
          
          {/* Callback для аутентификации через email */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Защищённый маршрут профиля */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* Страница 404 для любых других маршрутов */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;