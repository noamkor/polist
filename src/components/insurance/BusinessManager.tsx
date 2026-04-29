"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { CardListSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { TrashIcon } from "@/components/ui/icons";
import { InsuranceYearRecords } from "./InsuranceYearRecords";
import { labels } from "@/lib/utils/hebrew";

interface Business {
  id: string;
  businessName: string;
  address: string | null;
  notes: string | null;
  insurance: any[];
}

export function BusinessManager({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ businessName: "", address: "", notes: "" });

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}/businesses`);
    if (res.ok) setBusinesses(await res.json());
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch(`/api/clients/${clientId}/businesses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName: form.businessName, address: form.address || null, notes: form.notes || null }),
    });
    if (res.ok) {
      toast("העסק נוסף בהצלחה");
      fetchBusinesses();
      setShowAdd(false);
      setForm({ businessName: "", address: "", notes: "" });
    } else toast("שגיאה בהוספת העסק", "error");
    setAdding(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/clients/${clientId}/businesses/${deleteId}`, { method: "DELETE" });
    if (res.ok) { toast("העסק נמחק"); fetchBusinesses(); }
    else toast("שגיאה במחיקת העסק", "error");
    setDeleting(false);
    setDeleteId(null);
  }

  function closeAddModal() {
    setShowAdd(false);
    setForm({ businessName: "", address: "", notes: "" });
  }

  if (loading) return <CardListSkeleton />;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowAdd(true)}>{labels.newBusiness} +</Button>
      </div>

      {businesses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">אין עסקים</div>
      ) : (
        <div className="space-y-4">
          {businesses.map((biz) => (
            <div key={biz.id} className="bg-card rounded-xl shadow-sm border border-border-light overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-accent"
                onClick={() => setExpandedId(expandedId === biz.id ? null : biz.id)}>
                <div className="flex items-center gap-4">
                  <span className="font-bold">{biz.businessName}</span>
                  {biz.address && <span className="text-sm text-secondary-foreground">{biz.address}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" title={labels.delete} aria-label={labels.delete} onClick={(e) => { e.stopPropagation(); setDeleteId(biz.id); }}>
                    <span className="text-danger-600"><TrashIcon size={16} /></span>
                  </Button>
                  <svg className={`w-5 h-5 transition-transform ${expandedId === biz.id ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {expandedId === biz.id && (
                <div className="px-5 pb-5 border-t border-border-light pt-4 bg-background dark:bg-foreground/5">
                  <InsuranceYearRecords
                    apiUrl={`/api/clients/${clientId}/businesses/${biz.id}/insurance`}
                    clientId={clientId}
                    assetId={biz.id}
                    insuranceType="businessInsurance"
                    category="BUSINESS"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={closeAddModal} title={labels.newBusiness}>
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label={labels.businessName} value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} required />
          <Input label={labels.businessAddress} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          <Input label={labels.notes} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={closeAddModal}>{labels.cancel}</Button>
            <Button type="submit" loading={adding}>{labels.add}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title={labels.confirmDelete} message="האם למחוק עסק זה? כל רשומות הביטוח והמסמכים ימחקו." loading={deleting} />
    </div>
  );
}
