import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState } from "@/components/ui/ErrorState";
import { Loader } from "@/components/ui/Loader";
import { api } from "@/services/api";
function ReportsPage() {
  const { data: reports = [], isLoading, error, refetch } = useQuery({
    queryKey: ["reports"],
    queryFn: () => api.listReports()
  });
  const columns = [
    { key: "report_name", header: "Report Name" },
    { key: "report_type", header: "Type" },
    {
      key: "generated_at",
      header: "Generated",
      render: (row) => new Date(row.generated_at).toLocaleString()
    },
    { key: "file_path", header: "File", render: (row) => row.file_path ?? "\u2014" }
  ];
  return <div className="page"><section className="hero"><div><h1>Reports</h1><p>Manage generated operational reports and audit their output locations.</p></div></section>{isLoading && <Loader label="Loading reports..." />}{error && <ErrorState message={error.message} onRetry={() => void refetch()} />}{!isLoading && !error && <section className="card"><h2>Report Library</h2><DataTable columns={columns} data={reports} rowKey={(row) => row.id} emptyMessage="No reports generated yet." /></section>}</div>;
}
export {
  ReportsPage
};
