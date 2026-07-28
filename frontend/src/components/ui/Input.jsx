function Input({ label, hint, error, id, className = "", ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return <label className={`field-group ${className}`.trim()} htmlFor={inputId}>{label && <span className="field-label">{label}</span>}<input id={inputId} className={`field ${error ? "field-error" : ""}`.trim()} {...props} />{error ? <span className="field-error-text">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}</label>;
}
export {
  Input
};
