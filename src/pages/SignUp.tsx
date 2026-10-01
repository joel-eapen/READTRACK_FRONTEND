import { SignUp as ClerkSignUp } from "@clerk/clerk-react";
import "./SignIn.css";

/**
 * Sign-up page. Mirrors the SignIn layout but mounts Clerk's prebuilt
 * <SignUp> component. Shares SignIn.css for the brutalist intro panel.
 */
export function SignUp() {
  return (
    <div className="signin">
      <div className="signin__intro">
        <p className="label-caps signin__kicker">Join</p>
        <h1 className="signin__title">
          READ<span>TRACK</span>
        </h1>
        <p className="signin__blurb">
          Create an account to build your personal library and track every
          book you read.
        </p>
      </div>

      <div className="signin__clerk">
        <ClerkSignUp
          routing="path"
          path="/signup"
          signInUrl="/signin"
          forceRedirectUrl="/search"
        />
      </div>
    </div>
  );
}
