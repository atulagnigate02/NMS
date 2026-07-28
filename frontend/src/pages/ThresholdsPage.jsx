import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gauge, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { ErrorState } from "@/components/ui/ErrorState";
import { Table } from "@/components/ui/Table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/services/api";

function ThresholdsPage() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    device_type_id: "",
    metric_name: "",
    warning_value: "",
    critical_value: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  const { data: thresholds, isLoading, error, refetch } = useQuery({
    queryKey: ["thresholds"],
    queryFn: () => api.getThresholds()
  });

  const { data: deviceTypes } = useQuery({
    queryKey: ["device-types"],
    queryFn: () => api.getDeviceTypes()
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.createThreshold(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thresholds"] });
      setShowModal(false);
      setFormData({ device_type_id: "", metric_name: "", warning_value: "", critical_value: "" });
      setFormErrors({});
      success("Threshold created successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to create threshold");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateThreshold(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thresholds"] });
      setShowModal(false);
      setEditingItem(null);
      setFormData({ device_type_id: "", metric_name: "", warning_value: "", critical_value: "" });
      setFormErrors({});
      success("Threshold updated successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to update threshold");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteThreshold(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thresholds"] });
      setDeleteConfirm({ isOpen: false, id: null });
      success("Threshold deleted successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to delete threshold");
      setDeleteConfirm({ isOpen: false, id: null });
    }
  });

  const validateForm = () => {
    const errors = {};
    if (!formData.metric_name) {
      errors.metric_name = "Metric name is required";
    }
    if (!formData.warning_value || isNaN(formData.warning_value)) {
      errors.warning_value = "Warning value is required and must be a number";
    } else if (parseFloat(formData.warning_value) < 0) {
      errors.warning_value = "Warning value must be positive";
    }
    if (!formData.critical_value || isNaN(formData.critical_value)) {
      errors.critical_value = "Critical value is required and must be a number";
    } else if (parseFloat(formData.critical_value) < 0) {
      errors.critical_value = "Critical value must be positive";
    }
    if (formData.warning_value && formData.critical_value && 
        parseFloat(formData.warning_value) >= parseFloat(formData.critical_value)) {
      errors.critical_value = "Critical value must be greater than warning value";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const data = {
      ...formData,
      device_type_id: formData.device_type_id ? parseInt(formData.device_type_id) : null,
      warning_value: parseFloat(formData.warning_value),
      critical_value: parseFloat(formData.critical_value)
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      device_type_id: item.device_type_id?.toString() || "",
      metric_name: item.metric_name,
      warning_value: item.warning_value?.toString() || "",
      critical_value: item.critical_value?.toString() || ""
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const confirmDelete = () => {
    deleteMutation.mutate(deleteConfirm.id);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({ device_type_id: "", metric_name: "", warning_value: "", critical_value: "" });
    setFormErrors({});
  };

  if (isLoading) return <Loader fullPage label="Loading thresholds..." />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>Thresholds</h1>
          <p>Configure alert thresholds for device metrics</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
          Add Threshold
        </Button>
      </section>

      <Card className="management-card">
        <div className="management-head">
          <h2>All Thresholds</h2>
        </div>

        <Table
          data={thresholds || []}
          columns={[
            {
              accessor: "id",
              header: "ID",
              sortable: true
            },
            {
              accessor: "device_type",
              header: "Device Type",
              sortable: true,
              cell: (row) => row.device_type?.name || "All Types"
            },
            {
              accessor: "metric_name",
              header: "Metric",
              sortable: true,
              cell: (row) => (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Gauge size={16} />
                  <strong>{row.metric_name}</strong>
                </div>
              )
            },
            {
              accessor: "warning_value",
              header: "Warning",
              sortable: true,
              cell: (row) => (
                <span className="status-badge status-warning">
                  {row.warning_value}%
                </span>
              )
            },
            {
              accessor: "critical_value",
              header: "Critical",
              sortable: true,
              cell: (row) => (
                <span className="status-badge status-danger">
                  {row.critical_value}%
                </span>
              )
            }
          ]}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={(row) => handleDelete(row.id)}
          emptyMessage="No thresholds found. Add your first threshold to configure alerts."
        />
      </Card>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? "Edit Threshold" : "Add Threshold"}</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>✕</Button>
            </div>
            <form className="modal-body form-grid" onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label">Device Type</label>
                <select
                  className="select"
                  value={formData.device_type_id}
                  onChange={(e) => setFormData({ ...formData, device_type_id: e.target.value })}
                >
                  <option value="">All Device Types</option>
                  {deviceTypes?.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Metric Name *</label>
                <select
                  className={`select ${formErrors.metric_name ? "field-error" : ""}`}
                  value={formData.metric_name}
                  onChange={(e) => setFormData({ ...formData, metric_name: e.target.value })}
                >
                  <option value="">Select Metric</option>
                  <option value="cpu_usage">CPU Usage (%)</option>
                  <option value="memory_usage">Memory Usage (%)</option>
                  <option value="disk_usage">Disk Usage (%)</option>
                  <option value="temperature">Temperature (°C)</option>
                  <option value="latency">Latency (ms)</option>
                  <option value="packet_loss">Packet Loss (%)</option>
                  <option value="bandwidth_usage">Bandwidth Usage (%)</option>
                </select>
                {formErrors.metric_name && <div className="field-error-text">{formErrors.metric_name}</div>}
              </div>
              <div className="form-row">
                <div className="field-group full-width">
                  <label className="field-label">Warning Value *</label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.warning_value}
                    onChange={(e) => setFormData({ ...formData, warning_value: e.target.value })}
                    placeholder="e.g., 80"
                    className={formErrors.warning_value ? "field-error" : ""}
                  />
                  {formErrors.warning_value && <div className="field-error-text">{formErrors.warning_value}</div>}
                </div>
                <div className="field-group full-width">
                  <label className="field-label">Critical Value *</label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.critical_value}
                    onChange={(e) => setFormData({ ...formData, critical_value: e.target.value })}
                    placeholder="e.g., 90"
                    className={formErrors.critical_value ? "field-error" : ""}
                  />
                  {formErrors.critical_value && <div className="field-error-text">{formErrors.critical_value}</div>}
                </div>
              </div>
            </form>
            <div className="modal-footer">
              <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingItem ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Threshold"
        message="Are you sure you want to delete this threshold? This action cannot be undone."
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

export { ThresholdsPage };
