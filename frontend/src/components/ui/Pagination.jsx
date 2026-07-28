import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return <div className="pagination"><span className="pagination-info">
        Showing {from}–{to} of {total}</span><div className="pagination-controls"><Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} icon={<ChevronLeft size={14} />} /><span className="pagination-page">
          Page {page} / {totalPages}</span><Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} icon={<ChevronRight size={14} />} /></div></div>;
}
export {
  Pagination
};
