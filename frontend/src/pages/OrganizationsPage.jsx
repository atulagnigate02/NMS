import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { ErrorState } from "@/components/ui/ErrorState";
import { Table } from "@/components/ui/Table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/services/api";

function OrganizationsPage() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  const { data: organizations, isLoading, error, refetch } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.getOrganizations()
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setShowModal(false);
      setFormData({ name: "", description: "" });
      setFormErrors({});
      success("Organization created successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to create organization");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setShowModal(false);
      setEditingItem(null);
      setFormData({ name: "", description: "" });
      setFormErrors({});
      success("Organization updated successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to update organization");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setDeleteConfirm({ isOpen: false, id: null });
      success("Organization deleted successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to delete organization");
      setDeleteConfirm({ isOpen: false, id: null });
    }
  });

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (formData.name.length > 160) {
      errors.name = "Name must be less than 160 characters";
    }
    if (formData.description && formData.description.length > 500) {
      errors.description = "Description must be less than 500 characters";
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
    setFormData({ name: item.name, description: item.description || "" });
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
    setFormData({ name: "", description: "" });
    setFormErrors({});
  };

  if (isLoading) return <Loader fullPage label="Loading organizations..." />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>Organizations</h1>
          <p>Manage organizations and their hierarchical structure</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
          Add Organization
        </Button>
      </section>

      <Card className="management-card">
        <div className="management-head">
          <h2>All Organizations</h2>
        </div>

        <Table
          data={organizations || []}
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
                  <Building2 size={16} />
                  <strong>{row.name}</strong>
                </div>
              )
            },
            {
              accessor: "description",
              header: "Description",
              sortable: true,
              cell: (row) => row.description || "-"
            },
            {
              accessor: "created_at",
              header: "Created At",
              sortable: true,
              cell: (row) => new Date(row.created_at).toLocaleDateString()
            }
          ]}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={(row) => handleDelete(row.id)}
          emptyMessage="No organizations found. Create your first organization to get started."
        />
      </Card>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? "Edit Organization" : "Add Organization"}</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>✕</Button>
            </div>
            <form className="modal-body form-grid" onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Organization name"
                  className={formErrors.name ? "field-error" : ""}
                />
                {formErrors.name && <div className="field-error-text">{formErrors.name}</div>}
              </div>
              <div className="field-group">
                <label className="field-label">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Organization description"
                  className={formErrors.description ? "field-error" : ""}
                />
                {formErrors.description && <div className="field-error-text">{formErrors.description}</div>}
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
        title="Delete Organization"
        message="Are you sure you want to delete this organization? This action cannot be undone."
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

export { OrganizationsPage };
