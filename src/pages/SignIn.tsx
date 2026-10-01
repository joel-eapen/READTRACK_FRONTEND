import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import "./SignIn.css";

/**
 * Sign-in page. The brutalist intro panel sits beside Clerk's prebuilt
 * <SignIn> component, which handles email/password, social providers,
 * and sign-up links. Appearance is themed globally in clerkAppearance.ts.
 */
export function SignIn() {
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

      <div className="signin__clerk">
        <ClerkSignIn
          routing="path"
          path="/signin"
          signUpUrl="/signup"
          forceRedirectUrl="/search"
        />
      </div>
    </div>
  );
}
