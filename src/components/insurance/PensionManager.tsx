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

interface PensionPolicy {
  id: string;
  policyName: string;
  provider: string | null;
  notes: string | null;
  insurance: any[];
}

export function PensionManager({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const [policies, setPolicies] = useState<PensionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ policyName: "", provider: "", notes: "" });

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}/pension`);
    if (res.ok) setPolicies(await res.json());
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch(`/api/clients/${clientId}/pension`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policyName: form.policyName, provider: form.provider || null, notes: form.notes || null }),
    });
    if (res.ok) {
      toast("פוליסת הפנסיה נוספה בהצלחה");
      fetchPolicies();
      setShowAdd(false);
      setForm({ policyName: "", provider: "", notes: "" });
    } else toast("שגיאה בהוספת הפוליסה", "error");
    setAdding(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/clients/${clientId}/pension/${deleteId}`, { method: "DELETE" });
    if (res.ok) { toast("הפוליסה נמחקה"); fetchPolicies(); }
    else toast("שגיאה במחיקת הפוליסה", "error");
    setDeleting(false);
    setDeleteId(null);
  }

  function closeAddModal() {
    setShowAdd(false);
    setForm({ policyName: "", provider: "", notes: "" });
  }

  if (loading) return <CardListSkeleton />;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowAdd(true)}>{labels.newPensionPolicy} +</Button>
      </div>

      {policies.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">אין פוליסות פנסיה</div>
      ) : (
        <div className="space-y-4">
          {policies.map((policy) => (
            <div key={policy.id} className="bg-card rounded-xl shadow-sm border border-border-light overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-accent"
                onClick={() => setExpandedId(expandedId === policy.id ? null : policy.id)}>
                <div className="flex items-center gap-4">
                  <span className="font-bold">{policy.policyName}</span>
                  {policy.provider && <span className="text-sm text-secondary-foreground">{policy.provider}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteId(policy.id); }}>
                    <span className="text-danger-600">{labels.delete}</span>
                  </Button>
                  <svg className={`w-5 h-5 transition-transform ${expandedId === policy.id ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {expandedId === policy.id && (
                <div className="px-5 pb-5 border-t border-border-light pt-4 bg-background dark:bg-foreground/5">
                  <InsuranceYearRecords
                    apiUrl={`/api/clients/${clientId}/pension/${policy.id}/insurance`}
                    clientId={clientId}
                    assetId={policy.id}
                    insuranceType="pensionInsurance"
                    category="PENSION"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={closeAddModal} title={labels.newPensionPolicy}>
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label={labels.policyName} value={form.policyName} onChange={(e) => setForm((f) => ({ ...f, policyName: e.target.value }))} required />
          <Input label={labels.provider} value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} />
          <Input label={labels.notes} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={closeAddModal}>{labels.cancel}</Button>
            <Button type="submit" loading={adding}>{labels.add}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title={labels.confirmDelete} message="האם למחוק פוליסה זו? כל רשומות הביטוח והמסמכים ימחקו." loading={deleting} />
    </div>
  );
}
