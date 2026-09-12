import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <span className="not-found-code">404</span>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-description">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/dashboard" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
