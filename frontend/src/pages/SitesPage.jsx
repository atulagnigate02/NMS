import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { ErrorState } from "@/components/ui/ErrorState";
import { Table } from "@/components/ui/Table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/services/api";

function SitesPage() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    organization_id: "",
    name: "",
    city: "",
    state: "",
    latitude: "",
    longitude: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  const { data: sites, isLoading, error, refetch } = useQuery({
    queryKey: ["sites"],
    queryFn: () => api.getSites()
  });

  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.getOrganizations()
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.createSite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      setShowModal(false);
      setFormData({ organization_id: "", name: "", city: "", state: "", latitude: "", longitude: "" });
      setFormErrors({});
      success("Site created successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to create site");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateSite(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      setShowModal(false);
      setEditingItem(null);
      setFormData({ organization_id: "", name: "", city: "", state: "", latitude: "", longitude: "" });
      setFormErrors({});
      success("Site updated successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to update site");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteSite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      setDeleteConfirm({ isOpen: false, id: null });
      success("Site deleted successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to delete site");
      setDeleteConfirm({ isOpen: false, id: null });
    }
  });

  const validateForm = () => {
    const errors = {};
    if (!formData.organization_id) {
      errors.organization_id = "Organization is required";
    }
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (formData.name.length > 160) {
      errors.name = "Name must be less than 160 characters";
    }
    if (formData.latitude && (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90)) {
      errors.latitude = "Latitude must be between -90 and 90";
    }
    if (formData.longitude && (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180)) {
      errors.longitude = "Longitude must be between -180 and 180";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const data = {
      ...formData,
      organization_id: formData.organization_id ? parseInt(formData.organization_id) : null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null
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
      organization_id: item.organization_id?.toString() || "",
      name: item.name,
      city: item.city || "",
      state: item.state || "",
      latitude: item.latitude?.toString() || "",
      longitude: item.longitude?.toString() || ""
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
    setFormData({ organization_id: "", name: "", city: "", state: "", latitude: "", longitude: "" });
    setFormErrors({});
  };

  if (isLoading) return <Loader fullPage label="Loading sites..." />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>Sites</h1>
          <p>Manage sites and their geographical locations</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
          Add Site
        </Button>
      </section>

      <Card className="management-card">
        <div className="management-head">
          <h2>All Sites</h2>
        </div>

        <Table
          data={sites || []}
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
                  <MapPin size={16} />
                  <strong>{row.name}</strong>
                </div>
              )
            },
            {
              accessor: "organization",
              header: "Organization",
              sortable: true,
              cell: (row) => row.organization?.name || "-"
            },
            {
              accessor: "city",
              header: "Location",
              sortable: true,
              cell: (row) => row.city && row.state ? `${row.city}, ${row.state}` : row.city || row.state || "-"
            },
            {
              accessor: "latitude",
              header: "Coordinates",
              sortable: true,
              cell: (row) => row.latitude && row.longitude 
                ? `${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}` 
                : "-"
            }
          ]}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={(row) => handleDelete(row.id)}
          emptyMessage="No sites found. Create your first site to get started."
        />
      </Card>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? "Edit Site" : "Add Site"}</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>✕</Button>
            </div>
            <form className="modal-body form-grid" onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label">Organization *</label>
                <select
                  className={`select ${formErrors.organization_id ? "field-error" : ""}`}
                  value={formData.organization_id}
                  onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                >
                  <option value="">Select Organization</option>
                  {organizations?.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
                {formErrors.organization_id && <div className="field-error-text">{formErrors.organization_id}</div>}
              </div>
              <div className="field-group">
                <label className="field-label">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Site name"
                  className={formErrors.name ? "field-error" : ""}
                />
                {formErrors.name && <div className="field-error-text">{formErrors.name}</div>}
              </div>
              <div className="form-row">
                <div className="field-group full-width">
                  <label className="field-label">City</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                  />
                </div>
                <div className="field-group full-width">
                  <label className="field-label">State</label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="field-group full-width">
                  <label className="field-label">Latitude</label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="Latitude"
                    className={formErrors.latitude ? "field-error" : ""}
                  />
                  {formErrors.latitude && <div className="field-error-text">{formErrors.latitude}</div>}
                </div>
                <div className="field-group full-width">
                  <label className="field-label">Longitude</label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="Longitude"
                    className={formErrors.longitude ? "field-error" : ""}
                  />
                  {formErrors.longitude && <div className="field-error-text">{formErrors.longitude}</div>}
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
        title="Delete Site"
        message="Are you sure you want to delete this site? This action cannot be undone."
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

export { SitesPage };
