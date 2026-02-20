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

interface Home {
  id: string;
  address: string;
  notes: string | null;
  insurance: any[];
}

export function HomeManager({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ address: "", notes: "" });

  const fetchHomes = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}/homes`);
    if (res.ok) setHomes(await res.json());
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetchHomes(); }, [fetchHomes]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch(`/api/clients/${clientId}/homes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: form.address, notes: form.notes || null }),
    });
    if (res.ok) {
      toast("הדירה נוספה בהצלחה");
      fetchHomes();
      setShowAdd(false);
      setForm({ address: "", notes: "" });
    } else {
      toast("שגיאה בהוספת הדירה", "error");
    }
    setAdding(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/clients/${clientId}/homes/${deleteId}`, { method: "DELETE" });
    if (res.ok) { toast("הדירה נמחקה"); fetchHomes(); }
    else toast("שגיאה במחיקת הדירה", "error");
    setDeleting(false);
    setDeleteId(null);
  }

  function closeAddModal() {
    setShowAdd(false);
    setForm({ address: "", notes: "" });
  }

  if (loading) return <CardListSkeleton />;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowAdd(true)}>{labels.newHome} +</Button>
      </div>

      {homes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">אין דירות</div>
      ) : (
        <div className="space-y-4">
          {homes.map((home) => (
            <div key={home.id} className="bg-card rounded-xl shadow-sm border border-border-light overflow-hidden">
              <div
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-accent"
                onClick={() => setExpandedId(expandedId === home.id ? null : home.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="font-bold">{home.address}</span>
                  {home.notes && <span className="text-sm text-secondary-foreground">{home.notes}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteId(home.id); }}>
                    <span className="text-danger-600">{labels.delete}</span>
                  </Button>
                  <svg className={`w-5 h-5 transition-transform ${expandedId === home.id ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {expandedId === home.id && (
                <div className="px-5 pb-5 border-t border-border-light pt-4 bg-background dark:bg-foreground/5">
                  <InsuranceYearRecords
                    apiUrl={`/api/clients/${clientId}/homes/${home.id}/insurance`}
                    clientId={clientId}
                    assetId={home.id}
                    insuranceType="homeInsurance"
                    category="HOME"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={closeAddModal} title={labels.newHome}>
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label={labels.homeAddress} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} required />
          <Input label={labels.notes} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={closeAddModal}>{labels.cancel}</Button>
            <Button type="submit" loading={adding}>{labels.add}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title={labels.confirmDelete} message="האם למחוק דירה זו? כל רשומות הביטוח והמסמכים ימחקו." loading={deleting} />
    </div>
  );
}
