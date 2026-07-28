function Loader({ label = "Loading...", size = "md", fullPage = false }) {
  return <div className={`loader-wrap ${fullPage ? "loader-full" : ""}`} role="status" aria-live="polite"><div className={`loader-spinner loader-${size}`} /><span className="loader-label">{label}</span></div>;
}
export {
  Loader
};
