"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { TrashIcon, PencilIcon } from "@/components/ui/icons";
import { DocumentUploadPanel } from "./DocumentUploadPanel";
import { labels } from "@/lib/utils/hebrew";
import { formatDate } from "@/lib/utils/dates";

interface InsuranceRecord {
  id: string;
  year: number;
  provider: string | null;
  policyNumber: string | null;
  startDate: string | null;
  endDate: string | null;
  premium: number | null;
  notes: string | null;
  documents: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
  }>;
}

interface Props {
  apiUrl: string; // e.g. /api/clients/{clientId}/vehicles/{vehicleId}/insurance
  clientId: string;
  assetId: string;
  insuranceType: string; // e.g. "vehicleInsurance"
  category: string; // e.g. "VEHICLE"
}

const emptyForm = {
  year: new Date().getFullYear().toString(),
  provider: "",
  policyNumber: "",
  startDate: "",
  endDate: "",
  premium: "",
  notes: "",
};

function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export function InsuranceYearRecords({ apiUrl, clientId, assetId, insuranceType, category }: Props) {
  const { toast } = useToast();
  const [records, setRecords] = useState<InsuranceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editRecord, setEditRecord] = useState<InsuranceRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({ ...emptyForm });
  const [editForm, setEditForm] = useState({ ...emptyForm });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const res = await fetch(apiUrl);
    if (res.ok) {
      const data = await res.json();
      setRecords(data);
    }
    setLoading(false);
  }, [apiUrl]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  function resetForm() {
    setForm({ ...emptyForm });
  }

  function openEdit(record: InsuranceRecord) {
    setEditRecord(record);
    setEditForm({
      year: record.year.toString(),
      provider: record.provider || "",
      policyNumber: record.policyNumber || "",
      startDate: toDateInputValue(record.startDate),
      endDate: toDateInputValue(record.endDate),
      premium: record.premium?.toString() || "",
      notes: record.notes || "",
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: parseInt(form.year),
        provider: form.provider || null,
        policyNumber: form.policyNumber || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        premium: form.premium ? parseFloat(form.premium) : null,
        notes: form.notes || null,
      }),
    });

    if (res.ok) {
      toast("רשומת ביטוח נוספה בהצלחה");
      fetchRecords();
      setShowAdd(false);
      resetForm();
    } else {
      const data = await res.json();
      toast(data.error?.fieldErrors ? "שגיאה בנתונים" : "שגיאה בהוספה", "error");
    }
    setAdding(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editRecord) return;
    setSaving(true);

    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editRecord.id,
        year: parseInt(editForm.year),
        provider: editForm.provider || null,
        policyNumber: editForm.policyNumber || null,
        startDate: editForm.startDate || null,
        endDate: editForm.endDate || null,
        premium: editForm.premium ? parseFloat(editForm.premium) : null,
        notes: editForm.notes || null,
      }),
    });

    if (res.ok) {
      toast("רשומת ביטוח עודכנה בהצלחה");
      fetchRecords();
      setEditRecord(null);
    } else {
      toast("שגיאה בעדכון", "error");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteRecordId) return;
    setDeleting(true);

    const res = await fetch(`${apiUrl}?id=${deleteRecordId}`, { method: "DELETE" });
    if (res.ok) {
      toast("רשומת ביטוח נמחקה");
      fetchRecords();
    } else {
      toast("שגיאה במחיקה", "error");
    }
    setDeleting(false);
    setDeleteRecordId(null);
  }

  function closeAddModal() {
    setShowAdd(false);
    resetForm();
  }

  function closeEditModal() {
    setEditRecord(null);
    setEditForm({ ...emptyForm });
  }

  if (loading) return <CardListSkeleton />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">{labels.insuranceRecords}</h3>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          {labels.addInsuranceYear} +
        </Button>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground bg-muted rounded-lg">
          אין רשומות ביטוח
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="bg-muted rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg">{record.year}</span>
                  {record.provider && (
                    <span className="text-sm text-muted-foreground">{record.provider}</span>
                  )}
                  {record.policyNumber && (
                    <span className="text-sm text-secondary-foreground" dir="ltr">#{record.policyNumber}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {record.documents.length > 0 && (
                    <span className="text-sm bg-accent text-muted-foreground px-3 py-0.5 rounded-full">
                      {record.documents.length} {labels.documents}
                    </span>
                  )}
                  {record.premium && (
                    <span className="text-sm font-medium">
                      ₪{record.premium.toLocaleString()}
                    </span>
                  )}
                  <svg
                    className={`w-5 h-5 transition-transform ${expandedId === record.id ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expandedId === record.id && (
                <div className="px-4 pb-4 border-t border-border-light bg-background dark:bg-foreground/5">
                  <div className="flex justify-end gap-2 pt-3 mb-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      title={labels.edit}
                      aria-label={labels.edit}
                      onClick={() => openEdit(record)}
                    >
                      <span className="text-primary-600"><PencilIcon size={16} /></span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title={labels.delete}
                      aria-label={labels.delete}
                      onClick={() => setDeleteRecordId(record.id)}
                    >
                      <span className="text-danger-600"><TrashIcon size={16} /></span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 text-sm">
                    {record.startDate && (
                      <div>
                        <p className="text-muted-foreground">{labels.startDate}</p>
                        <p>{formatDate(record.startDate)}</p>
                      </div>
                    )}
                    {record.endDate && (
                      <div>
                        <p className="text-muted-foreground">{labels.endDate}</p>
                        <p>{formatDate(record.endDate)}</p>
                      </div>
                    )}
                    {record.premium && (
                      <div>
                        <p className="text-muted-foreground">{labels.premium}</p>
                        <p>₪{record.premium.toLocaleString()}</p>
                      </div>
                    )}
                    {record.notes && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">{labels.notes}</p>
                        <p>{record.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  <DocumentUploadPanel
                    clientId={clientId}
                    assetId={assetId}
                    recordId={record.id}
                    year={record.year}
                    insuranceType={insuranceType}
                    category={category}
                    documents={record.documents}
                    onDocumentsChange={fetchRecords}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Year Modal */}
      <Modal open={showAdd} onClose={closeAddModal} title={labels.addInsuranceYear} maxWidth="max-w-xl">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={labels.year}
              value={form.year}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setForm((f) => ({ ...f, year: val }));
              }}
              dir="ltr"
              required
            />
            <Input
              label={labels.provider}
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
            />
            <Input
              label={labels.policyNumber}
              value={form.policyNumber}
              onChange={(e) => setForm((f) => ({ ...f, policyNumber: e.target.value }))}
            />
            <Input
              label={labels.premium}
              value={form.premium}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                setForm((f) => ({ ...f, premium: val }));
              }}
              dir="ltr"
            />
            <Input
              label={labels.startDate}
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
            <Input
              label={labels.endDate}
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <Input
            label={labels.notes}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex gap-3 justify-start">
            <Button variant="secondary" type="button" onClick={closeAddModal}>
              {labels.cancel}
            </Button>
            <Button type="submit" loading={adding}>
              {labels.add}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Year Modal */}
      <Modal open={!!editRecord} onClose={closeEditModal} title={labels.editInsuranceYear} maxWidth="max-w-xl">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={labels.year}
              value={editForm.year}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setEditForm((f) => ({ ...f, year: val }));
              }}
              dir="ltr"
              required
            />
            <Input
              label={labels.provider}
              value={editForm.provider}
              onChange={(e) => setEditForm((f) => ({ ...f, provider: e.target.value }))}
            />
            <Input
              label={labels.policyNumber}
              value={editForm.policyNumber}
              onChange={(e) => setEditForm((f) => ({ ...f, policyNumber: e.target.value }))}
            />
            <Input
              label={labels.premium}
              value={editForm.premium}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, "");
                setEditForm((f) => ({ ...f, premium: val }));
              }}
              dir="ltr"
            />
            <Input
              label={labels.startDate}
              type="date"
              value={editForm.startDate}
              onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))}
            />
            <Input
              label={labels.endDate}
              type="date"
              value={editForm.endDate}
              onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <Input
            label={labels.notes}
            value={editForm.notes}
            onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex gap-3 justify-start">
            <Button variant="secondary" type="button" onClick={closeEditModal}>
              {labels.cancel}
            </Button>
            <Button type="submit" loading={saving}>
              {labels.save}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Insurance Record Confirm */}
      <ConfirmDialog
        open={!!deleteRecordId}
        onClose={() => setDeleteRecordId(null)}
        onConfirm={handleDelete}
        title={labels.confirmDelete}
        message="האם למחוק רשומת ביטוח זו? כל המסמכים המשויכים ימחקו."
        loading={deleting}
      />
    </div>
  );
}
