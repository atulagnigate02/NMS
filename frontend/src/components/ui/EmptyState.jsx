import { Inbox } from "lucide-react";
function EmptyState({ title, description, action, icon }) {
  return <div className="empty-state"><div className="empty-icon">{icon ?? <Inbox size={28} />}</div><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>;
}
export {
  EmptyState
};
