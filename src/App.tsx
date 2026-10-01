import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Library } from "./pages/Library";
import { Search } from "./pages/Search";
import { SignIn } from "./pages/SignIn";
import { AuthProvider } from "./store/AuthContext";
import { LibraryProvider } from "./store/LibraryContext";

export default function App() {
  return (
    <AuthProvider>
      <LibraryProvider>
        <Router>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/search" element={<Search />} />
                <Route path="/library" element={<Library />} />
                <Route path="/" element={<Navigate to="/search" replace />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LibraryProvider>
    </AuthProvider>
  );
}
