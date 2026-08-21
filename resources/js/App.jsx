import { Routes, Route } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import AuthLayout from './components/layout/AuthLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AppPlaceholder from './pages/AppPlaceholder';
import ProtectedRoute from './routes/ProtectedRoute';

export default function App() {
    return (
        <Routes>
            <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
            </Route>

            <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route
                path="/app"
                element={
                    <ProtectedRoute>
                        <AppPlaceholder />
                    </ProtectedRoute>
                }
            />

            <Route path="*" element={<LandingPage />} />
        </Routes>
    );
}
