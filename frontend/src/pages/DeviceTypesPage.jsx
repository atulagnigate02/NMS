import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Cpu, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { ErrorState } from "@/components/ui/ErrorState";
import { Table } from "@/components/ui/Table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/services/api";

function DeviceTypesPage() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  const { data: deviceTypes, isLoading, error, refetch } = useQuery({
    queryKey: ["device-types"],
    queryFn: () => api.getDeviceTypes()
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.createDeviceType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-types"] });
      setShowModal(false);
      setFormData({ name: "" });
      setFormErrors({});
      success("Device type created successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to create device type");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateDeviceType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-types"] });
      setShowModal(false);
      setEditingItem(null);
      setFormData({ name: "" });
      setFormErrors({});
      success("Device type updated successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to update device type");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteDeviceType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-types"] });
      setDeleteConfirm({ isOpen: false, id: null });
      success("Device type deleted successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to delete device type");
      setDeleteConfirm({ isOpen: false, id: null });
    }
  });

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Device type name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Device type name must be at least 2 characters";
    } else if (formData.name.length > 80) {
      errors.name = "Device type name must be less than 80 characters";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name });
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
    setFormData({ name: "" });
    setFormErrors({});
  };

  if (isLoading) return <Loader fullPage label="Loading device types..." />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>Device Types</h1>
          <p>Manage device types for classification and monitoring</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
          Add Device Type
        </Button>
      </section>

      <Card className="management-card">
        <div className="management-head">
          <h2>All Device Types</h2>
        </div>

        <Table
          data={deviceTypes || []}
          columns={[
            {
              accessor: "id",
              header: "ID",
              sortable: true
            },
            {
              accessor: "name",
              header: "Name",
              sortable: true,
              cell: (row) => (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Cpu size={16} />
                  <strong>{row.name}</strong>
                </div>
              )
            }
          ]}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={(row) => handleDelete(row.id)}
          emptyMessage="No device types found. Add your first device type to get started."
        />
      </Card>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? "Edit Device Type" : "Add Device Type"}</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>✕</Button>
            </div>
            <form className="modal-body form-grid" onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label">Device Type Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Router, Switch, Firewall, Server"
                  className={formErrors.name ? "field-error" : ""}
                />
                {formErrors.name && <div className="field-error-text">{formErrors.name}</div>}
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
        title="Delete Device Type"
        message="Are you sure you want to delete this device type? This action cannot be undone."
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

export { DeviceTypesPage };
