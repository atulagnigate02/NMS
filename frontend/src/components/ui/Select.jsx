function Select({ label, options, id, className = "", ...props }) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return <label className={`field-group ${className}`.trim()} htmlFor={selectId}>{label && <span className="field-label">{label}</span>}<select id={selectId} className="select" {...props}>{options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></label>;
}
export {
  Select
};
