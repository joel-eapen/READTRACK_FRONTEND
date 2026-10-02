import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Layout } from "./components/Layout";
import { Library } from "./pages/Library";
import { Search } from "./pages/Search";
import { Settings } from "./pages/Settings";
import { ApiDocs } from "./pages/ApiDocs";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { LibraryProvider } from "./store/LibraryContext";

/**
 * Clerk-gated routes. Signed-out users are redirected to /signin, which
 * renders Clerk's <SignIn> component. Signed-in users see the app shell.
 */
export default function App() {
  return (
    <LibraryProvider>
      <Router>
        <Routes>
          <Route path="/signin/*" element={<SignIn />} />
          <Route path="/signup/*" element={<SignUp />} />
          {/* Public developer API documentation — no authentication required. */}
          <Route path="/docs" element={<ApiDocs />} />
          <Route
            element={
              <>
                <SignedIn>
                  <Layout />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/signin" replace />
                </SignedOut>
              </>
            }
          >
            <Route path="/search" element={<Search />} />
            <Route path="/library" element={<Library />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={<Navigate to="/search" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </LibraryProvider>
  );
}
