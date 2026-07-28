const variantClass = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger"
};
const sizeClass = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg"
};
function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}) {
  return <button
    className={`btn ${variantClass[variant]} ${sizeClass[size]} ${className}`.trim()}
    disabled={disabled || loading}
    {...props}
  >{loading ? <span className="btn-spinner" aria-hidden /> : icon}{children}</button>;
}
export {
  Button
};
