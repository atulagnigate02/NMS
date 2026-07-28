import { Search as SearchIcon } from "lucide-react";
function Search({ onSearch, onChange, className = "", ...props }) {
  return <div className={`search-box ${className}`.trim()}><SearchIcon size={16} className="search-icon" /><input
    className="search-input"
    type="search"
    onChange={(event) => {
      onChange?.(event);
      onSearch?.(event.target.value);
    }}
    {...props}
  /></div>;
}
export {
  Search
};
