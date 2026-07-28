function Card({
  title,
  subtitle,
  action,
  variant = "default",
  children,
  className = "",
  ...props
}) {
  return <section className={`card card-${variant} ${className}`.trim()} {...props}>{(title || action) && <header className="card-header"><div>{title && <h2 className="card-title">{title}</h2>}{subtitle && <p className="card-subtitle">{subtitle}</p>}</div>{action}</header>}<div className="card-body">{children}</div></section>;
}
export {
  Card
};
