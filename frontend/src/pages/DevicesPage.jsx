import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Network, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { ErrorState } from "@/components/ui/ErrorState";
import { Table } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/services/api";

function DevicesPage() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    site_id: "",
    hostname: "",
    ip_address: "",
    vendor_id: "",
    device_type_id: "",
    model: "",
    serial_number: "",
    firmware_version: "",
    status: "unknown",
    monitoring_status: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  const { data: devices, isLoading, error, refetch } = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.listDevices()
  });

  const { data: sites } = useQuery({
    queryKey: ["sites"],
    queryFn: () => api.getSites()
  });

  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => api.getVendors()
  });

  const { data: deviceTypes } = useQuery({
    queryKey: ["device-types"],
    queryFn: () => api.getDeviceTypes()
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.createDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      setShowModal(false);
      resetForm();
      success("Device created successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to create device");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      success("Device updated successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to update device");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      setDeleteConfirm({ isOpen: false, id: null });
      success("Device deleted successfully");
    },
    onError: (err) => {
      showError(err.response?.data?.detail || "Failed to delete device");
      setDeleteConfirm({ isOpen: false, id: null });
    }
  });

  const resetForm = () => {
    setFormData({
      site_id: "",
      hostname: "",
      ip_address: "",
      vendor_id: "",
      device_type_id: "",
      model: "",
      serial_number: "",
      firmware_version: "",
      status: "unknown",
      monitoring_status: true
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.hostname.trim()) {
      errors.hostname = "Hostname is required";
    } else if (formData.hostname.length < 2) {
      errors.hostname = "Hostname must be at least 2 characters";
    } else if (formData.hostname.length > 160) {
      errors.hostname = "Hostname must be less than 160 characters";
    }
    if (!formData.ip_address.trim()) {
      errors.ip_address = "IP address is required";
    } else {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(formData.ip_address)) {
        errors.ip_address = "Invalid IP address format";
      }
    }
    if (formData.model && formData.model.length > 120) {
      errors.model = "Model must be less than 120 characters";
    }
    if (formData.serial_number && formData.serial_number.length > 120) {
      errors.serial_number = "Serial number must be less than 120 characters";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const data = {
      ...formData,
      site_id: formData.site_id ? parseInt(formData.site_id) : null,
      vendor_id: formData.vendor_id ? parseInt(formData.vendor_id) : null,
      device_type_id: formData.device_type_id ? parseInt(formData.device_type_id) : null
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
      site_id: item.site_id?.toString() || "",
      hostname: item.hostname,
      ip_address: item.ip_address,
      vendor_id: item.vendor_id?.toString() || "",
      device_type_id: item.device_type_id?.toString() || "",
      model: item.model || "",
      serial_number: item.serial_number || "",
      firmware_version: item.firmware_version || "",
      status: item.status || "unknown",
      monitoring_status: item.monitoring_status ?? true
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
    resetForm();
  };

  if (isLoading) return <Loader fullPage label="Loading devices..." />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>Device Inventory</h1>
          <p>Track inventory, health, and monitoring posture across your environment.</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
          Add Device
        </Button>
      </section>

      <Card className="management-card">
        <div className="management-head">
          <h2>Inventory List</h2>
        </div>

        <Table
          data={devices || []}
          columns={[
            {
              accessor: "hostname",
              header: "Hostname",
              sortable: true,
              cell: (row) => (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Network size={16} />
                  <strong>{row.hostname}</strong>
                </div>
              )
            },
            {
              accessor: "ip_address",
              header: "IP Address",
              sortable: true
            },
            {
              accessor: "status",
              header: "Status",
              sortable: true,
              cell: (row) => <StatusBadge status={row.status} />
            },
            {
              accessor: "model",
              header: "Model",
              sortable: true,
              cell: (row) => row.model || "-"
            },
            {
              accessor: "monitoring_status",
              header: "Monitoring",
              sortable: true,
              cell: (row) => <StatusBadge status={row.monitoring_status ? "active" : "inactive"} />
            },
            {
              accessor: "last_seen",
              header: "Last Seen",
              sortable: true,
              cell: (row) => row.last_seen ? new Date(row.last_seen).toLocaleString() : "-"
            }
          ]}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={(row) => handleDelete(row.id)}
          emptyMessage="No devices found. Add your first device to get started."
        />
      </Card>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? "Edit Device" : "Add Device"}</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>✕</Button>
            </div>
            <form className="modal-body form-grid" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="field-group full-width">
                  <label className="field-label">Site</label>
                  <select
                    className="select"
                    value={formData.site_id}
                    onChange={(e) => setFormData({ ...formData, site_id: e.target.value })}
                  >
                    <option value="">Select Site</option>
                    {sites?.map((site) => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field-group full-width">
                  <label className="field-label">Vendor</label>
                  <select
                    className="select"
                    value={formData.vendor_id}
                    onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                  >
                    <option value="">Select Vendor</option>
                    {vendors?.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>{vendor.vendor_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field-group full-width">
                  <label className="field-label">Hostname *</label>
                  <Input
                    value={formData.hostname}
                    onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                    placeholder="e.g., core-router-01"
                    className={formErrors.hostname ? "field-error" : ""}
                  />
                  {formErrors.hostname && <div className="field-error-text">{formErrors.hostname}</div>}
                </div>
                <div className="field-group full-width">
                  <label className="field-label">IP Address *</label>
                  <Input
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    placeholder="e.g., 192.168.1.1"
                    className={formErrors.ip_address ? "field-error" : ""}
                  />
                  {formErrors.ip_address && <div className="field-error-text">{formErrors.ip_address}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="field-group full-width">
                  <label className="field-label">Device Type</label>
                  <select
                    className="select"
                    value={formData.device_type_id}
                    onChange={(e) => setFormData({ ...formData, device_type_id: e.target.value })}
                  >
                    <option value="">Select Device Type</option>
                    {deviceTypes?.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field-group full-width">
                  <label className="field-label">Status</label>
                  <select
                    className="select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="unknown">Unknown</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field-group full-width">
                  <label className="field-label">Model</label>
                  <Input
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g., ISR 4331"
                    className={formErrors.model ? "field-error" : ""}
                  />
                  {formErrors.model && <div className="field-error-text">{formErrors.model}</div>}
                </div>
                <div className="field-group full-width">
                  <label className="field-label">Serial Number</label>
                  <Input
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    placeholder="e.g., FTX1234ABC"
                    className={formErrors.serial_number ? "field-error" : ""}
                  />
                  {formErrors.serial_number && <div className="field-error-text">{formErrors.serial_number}</div>}
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Firmware Version</label>
                <Input
                  value={formData.firmware_version}
                  onChange={(e) => setFormData({ ...formData, firmware_version: e.target.value })}
                  placeholder="e.g., 17.09"
                />
              </div>
              <div className="field-group">
                <label className="field-label" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    checked={formData.monitoring_status}
                    onChange={(e) => setFormData({ ...formData, monitoring_status: e.target.checked })}
                  />
                  Enable Monitoring
                </label>
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
        title="Delete Device"
        message="Are you sure you want to delete this device? This action cannot be undone."
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

export { DevicesPage };

