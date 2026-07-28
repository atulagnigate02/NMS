import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { ErrorState } from "@/components/ui/ErrorState";
import { Table } from "@/components/ui/Table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/services/api";

function VendorsPage() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ vendor_name: "" });
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  const { data: vendors, isLoading, error, refetch } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => api.getVendors()
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.createVendor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setShowModal(false);
      setFormData({ vendor_name: "" });
      setFormErrors({});
      success("Vendor created successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to create vendor");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setShowModal(false);
      setEditingItem(null);
      setFormData({ vendor_name: "" });
      setFormErrors({});
      success("Vendor updated successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to update vendor");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setDeleteConfirm({ isOpen: false, id: null });
      success("Vendor deleted successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to delete vendor");
      setDeleteConfirm({ isOpen: false, id: null });
    }
  });

  const validateForm = () => {
    const errors = {};
    if (!formData.vendor_name.trim()) {
      errors.vendor_name = "Vendor name is required";
    } else if (formData.vendor_name.length < 2) {
      errors.vendor_name = "Vendor name must be at least 2 characters";
    } else if (formData.vendor_name.length > 120) {
      errors.vendor_name = "Vendor name must be less than 120 characters";
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
    setFormData({ vendor_name: item.vendor_name });
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
    setFormData({ vendor_name: "" });
    setFormErrors({});
  };

  if (isLoading) return <Loader fullPage label="Loading vendors..." />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>Vendors</h1>
          <p>Manage device vendors and manufacturers</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
          Add Vendor
        </Button>
      </section>

      <Card className="management-card">
        <div className="management-head">
          <h2>All Vendors</h2>
        </div>

        <Table
          data={vendors || []}
          columns={[
            {
              accessor: "id",
              header: "ID",
              sortable: true
            },
            {
              accessor: "vendor_name",
              header: "Vendor Name",
              sortable: true,
              cell: (row) => (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Building size={16} />
                  <strong>{row.vendor_name}</strong>
                </div>
              )
            }
          ]}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={(row) => handleDelete(row.id)}
          emptyMessage="No vendors found. Add your first vendor to get started."
        />
      </Card>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? "Edit Vendor" : "Add Vendor"}</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>✕</Button>
            </div>
            <form className="modal-body form-grid" onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label">Vendor Name *</label>
                <Input
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  placeholder="e.g., Cisco, Fortinet, Juniper"
                  className={formErrors.vendor_name ? "field-error" : ""}
                />
                {formErrors.vendor_name && <div className="field-error-text">{formErrors.vendor_name}</div>}
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
        title="Delete Vendor"
        message="Are you sure you want to delete this vendor? This action cannot be undone."
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

export { VendorsPage };
