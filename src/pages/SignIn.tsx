import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input } from "../components/ui";
import { useAuth } from "../store/AuthContext";
import "./SignIn.css";

export function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email";
    }
    if (password.length < 6) {
      next.password = "Min 6 characters";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Simulated auth — no backend. Persists locally.
    setTimeout(() => {
      signIn(email);
      navigate("/search");
    }, 400);
  };

  return (
    <div className="signin">
      <div className="signin__intro">
        <p className="label-caps signin__kicker">Welcome to</p>
        <h1 className="signin__title">
          READ<span>TRACK</span>
        </h1>
        <p className="signin__blurb">
          Track every book. Build your personal library. No frills, just
          function.
        </p>
      </div>

      <Card as="section" className="signin__card">
        <h2 className="signin__heading">Sign In</h2>
        <form className="signin__form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />
          <Button type="submit" size="lg" fullWidth loading={loading}>
            Enter Library
          </Button>
        </form>
        <p className="signin__note label-caps">
          Demo only — any valid email + 6+ char password works.
        </p>
      </Card>
    </div>
  );
}
