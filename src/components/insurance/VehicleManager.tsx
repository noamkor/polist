"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { InsuranceYearRecords } from "./InsuranceYearRecords";
import { labels } from "@/lib/utils/hebrew";

interface Vehicle {
  id: string;
  licensePlate: string;
  manufacturer: string | null;
  model: string | null;
  year: number | null;
  insurance: any[];
}

export function VehicleManager({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    licensePlate: "",
    manufacturer: "",
    model: "",
    year: "",
  });

  const [editForm, setEditForm] = useState({
    licensePlate: "",
    manufacturer: "",
    model: "",
    year: "",
  });

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}/vehicles`);
    if (res.ok) setVehicles(await res.json());
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  function openEdit(vehicle: Vehicle) {
    setEditVehicle(vehicle);
    setEditForm({
      licensePlate: vehicle.licensePlate,
      manufacturer: vehicle.manufacturer || "",
      model: vehicle.model || "",
      year: vehicle.year?.toString() || "",
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);

    const res = await fetch(`/api/clients/${clientId}/vehicles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licensePlate: form.licensePlate,
        manufacturer: form.manufacturer || null,
        model: form.model || null,
        year: form.year ? parseInt(form.year) : null,
      }),
    });

    if (res.ok) {
      toast("הרכב נוסף בהצלחה");
      fetchVehicles();
      setShowAdd(false);
      setForm({ licensePlate: "", manufacturer: "", model: "", year: "" });
    } else {
      toast("שגיאה בהוספת הרכב", "error");
    }
    setAdding(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editVehicle) return;
    setSaving(true);

    const res = await fetch(`/api/clients/${clientId}/vehicles/${editVehicle.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licensePlate: editForm.licensePlate,
        manufacturer: editForm.manufacturer || null,
        model: editForm.model || null,
        year: editForm.year ? parseInt(editForm.year) : null,
      }),
    });

    if (res.ok) {
      toast("הרכב עודכן בהצלחה");
      fetchVehicles();
      setEditVehicle(null);
    } else {
      toast("שגיאה בעדכון הרכב", "error");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/clients/${clientId}/vehicles/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast("הרכב נמחק");
      fetchVehicles();
    } else {
      toast("שגיאה במחיקת הרכב", "error");
    }
    setDeleting(false);
    setDeleteId(null);
  }

  function closeAddModal() {
    setShowAdd(false);
    setForm({ licensePlate: "", manufacturer: "", model: "", year: "" });
  }

  function closeEditModal() {
    setEditVehicle(null);
    setEditForm({ licensePlate: "", manufacturer: "", model: "", year: "" });
  }

  if (loading) return <CardListSkeleton />;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowAdd(true)}>{labels.newVehicle} +</Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">אין רכבים</div>
      ) : (
        <div className="space-y-4">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-card rounded-xl shadow-sm border border-border-light overflow-hidden">
              <div
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-accent"
                onClick={() => setExpandedId(expandedId === vehicle.id ? null : vehicle.id)}
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-bold text-lg" dir="ltr">{vehicle.licensePlate}</span>
                  {vehicle.manufacturer && (
                    <span className="text-muted-foreground">
                      {vehicle.manufacturer} {vehicle.model || ""}
                    </span>
                  )}
                  {vehicle.year && (
                    <span className="text-sm text-secondary-foreground">{vehicle.year}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); openEdit(vehicle); }}
                  >
                    <span className="text-primary-600">{labels.edit}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setDeleteId(vehicle.id); }}
                  >
                    <span className="text-danger-600">{labels.delete}</span>
                  </Button>
                  <svg
                    className={`w-5 h-5 transition-transform ${expandedId === vehicle.id ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {expandedId === vehicle.id && (
                <div className="px-5 pb-5 border-t border-border-light pt-4 bg-background dark:bg-foreground/5">
                  <InsuranceYearRecords
                    apiUrl={`/api/clients/${clientId}/vehicles/${vehicle.id}/insurance`}
                    clientId={clientId}
                    assetId={vehicle.id}
                    insuranceType="vehicleInsurance"
                    category="VEHICLE"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      <Modal open={showAdd} onClose={closeAddModal} title={labels.newVehicle}>
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label={labels.licensePlate}
            value={form.licensePlate}
            onChange={(e) => setForm((f) => ({ ...f, licensePlate: e.target.value }))}
            required
            dir="ltr"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={labels.manufacturer}
              value={form.manufacturer}
              onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
            />
            <Input
              label={labels.model}
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
            />
          </div>
          <Input
            label={labels.vehicleYear}
            value={form.year}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              setForm((f) => ({ ...f, year: val }));
            }}
            dir="ltr"
          />
          <div className="flex gap-3 justify-start">
            <Button variant="secondary" type="button" onClick={closeAddModal}>
              {labels.cancel}
            </Button>
            <Button type="submit" loading={adding}>{labels.add}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal open={!!editVehicle} onClose={closeEditModal} title={labels.editVehicle}>
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label={labels.licensePlate}
            value={editForm.licensePlate}
            onChange={(e) => setEditForm((f) => ({ ...f, licensePlate: e.target.value }))}
            required
            dir="ltr"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={labels.manufacturer}
              value={editForm.manufacturer}
              onChange={(e) => setEditForm((f) => ({ ...f, manufacturer: e.target.value }))}
            />
            <Input
              label={labels.model}
              value={editForm.model}
              onChange={(e) => setEditForm((f) => ({ ...f, model: e.target.value }))}
            />
          </div>
          <Input
            label={labels.vehicleYear}
            value={editForm.year}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              setEditForm((f) => ({ ...f, year: val }));
            }}
            dir="ltr"
          />
          <div className="flex gap-3 justify-start">
            <Button variant="secondary" type="button" onClick={closeEditModal}>
              {labels.cancel}
            </Button>
            <Button type="submit" loading={saving}>{labels.save}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={labels.confirmDelete}
        message="האם למחוק רכב זה? כל רשומות הביטוח והמסמכים ימחקו."
        loading={deleting}
      />
    </div>
  );
}
