import { useQuery } from "@tanstack/react-query";
import { FileText, Clock, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { ErrorState } from "@/components/ui/ErrorState";
import { Table } from "@/components/ui/Table";
import { api } from "@/services/api";

function AuditLogsPage() {
  const { data: auditLogs, isLoading, error, refetch } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => api.getAuditLogs()
  });

  if (isLoading) return <Loader fullPage label="Loading audit logs..." />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const getActionBadge = (action) => {
    const actionColors = {
      CREATE: "status-success",
      UPDATE: "status-info",
      DELETE: "status-danger",
      LOGIN: "status-info",
      ASSIGN_ROLE: "status-warning",
      ASSIGN_PERMISSIONS: "status-warning",
      ADD_PERMISSION: "status-warning",
      REMOVE_PERMISSION: "status-danger",
      ACKNOWLEDGE: "status-info",
      RESOLVE: "status-success",
      RUN_DISCOVERY: "status-info"
    };
    return actionColors[action] || "status-neutral";
  };

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>Audit Logs</h1>
          <p>Track all system actions and user activities</p>
        </div>
      </section>

      <Card className="management-card">
        <div className="management-head">
          <h2>Recent Activity</h2>
        </div>

        <Table
          data={auditLogs || []}
          columns={[
            {
              accessor: "timestamp",
              header: "Timestamp",
              sortable: true,
              cell: (row) => (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={16} />
                  <span>{new Date(row.timestamp).toLocaleString()}</span>
                </div>
              )
            },
            {
              accessor: "user",
              header: "User",
              sortable: true,
              cell: (row) => (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <User size={16} />
                  <span>{row.user?.name || "System"}</span>
                </div>
              )
            },
            {
              accessor: "action",
              header: "Action",
              sortable: true,
              cell: (row) => (
                <span className={`status-badge ${getActionBadge(row.action)}`}>
                  {row.action}
                </span>
              )
            },
            {
              accessor: "resource_name",
              header: "Resource",
              sortable: true,
              cell: (row) => (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileText size={16} />
                  <span>{row.resource_name}</span>
                </div>
              )
            }
          ]}
          loading={isLoading}
          emptyMessage="No audit logs found yet."
        />
      </Card>
    </div>
  );
}

export { AuditLogsPage };
