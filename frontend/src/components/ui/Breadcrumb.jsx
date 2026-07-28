import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
function Breadcrumb({ items }) {
  return <nav className="breadcrumb" aria-label="Breadcrumb">{items.map((item, index) => {
    const isLast = index === items.length - 1;
    return <span key={`${item.label}-${index}`} className="breadcrumb-item">{item.to && !isLast ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}{!isLast && <ChevronRight size={14} className="breadcrumb-sep" />}</span>;
  })}</nav>;
}
export {
  Breadcrumb
};
