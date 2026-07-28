import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
function ErrorState({ title = "Something went wrong", message, onRetry, action }) {
  return <div className="error-state" role="alert"><AlertTriangle size={24} /><div><h3>{title}</h3><p>{message}</p></div>{onRetry && <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>}{action}</div>;
}
export {
  ErrorState
};
