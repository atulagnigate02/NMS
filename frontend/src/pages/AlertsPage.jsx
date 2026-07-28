import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { ErrorState } from "@/components/ui/ErrorState";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/services/api";

function AlertsPage() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [statusFilter, setStatusFilter] = useState("open");

  const { data: alerts = [], isLoading, error, refetch } = useQuery({
    queryKey: ["alerts", statusFilter],
    queryFn: () => api.listAlerts(statusFilter === "all" ? void 0 : statusFilter)
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }) => action === "acknowledge" ? api.acknowledgeAlert(id) : api.resolveAlert(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      success(`Alert ${variables.action === "acknowledge" ? "acknowledged" : "resolved"} successfully`);
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Unable to update alert");
    }
  });

  const handleAcknowledge = (row) => {
    actionMutation.mutate({ id: row.id, action: "acknowledge" });
  };

  const handleResolve = (row) => {
    actionMutation.mutate({ id: row.id, action: "resolve" });
  };

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>Alert Center</h1>
          <p>Review incidents, acknowledge them, and mark them resolved from a single workflow.</p>
        </div>
        <Select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "open", label: "Open" },
            { value: "acknowledged", label: "Acknowledged" },
            { value: "resolved", label: "Resolved" },
            { value: "all", label: "All" }
          ]}
        />
      </section>

      {isLoading && <Loader label="Loading alerts..." />}
      {error && <ErrorState message={error.message} onRetry={() => refetch()} />}

      {!isLoading && !error && (
        <Card className="management-card">
          <div className="management-head">
            <h2>Incident Queue</h2>
          </div>

          <Table
            data={alerts}
            columns={[
              {
                accessor: "severity",
                header: "Severity",
                sortable: true,
                cell: (row) => <StatusBadge status={row.severity} />
              },
              {
                accessor: "title",
                header: "Title",
                sortable: true
              },
              {
                accessor: "status",
                header: "Status",
                sortable: true,
                cell: (row) => <StatusBadge status={row.status} />
              },
              {
                accessor: "created_at",
                header: "Created",
                sortable: true,
                cell: (row) => new Date(row.created_at).toLocaleString()
              }
            ]}
            loading={isLoading}
            onEdit={handleAcknowledge}
            onDelete={handleResolve}
            editLabel="Acknowledge"
            deleteLabel="Resolve"
            emptyMessage="No alerts for this filter."
          />
        </Card>
      )}
    </div>
  );
}

export { AlertsPage };

