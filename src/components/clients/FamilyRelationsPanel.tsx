"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { TrashIcon } from "@/components/ui/icons";
import { labels, relationLabels } from "@/lib/utils/hebrew";
import { buildFamilyRelations, FamilyRelationView } from "@/lib/family-relations";

interface Props {
  clientId: string;
}

export function FamilyRelationsPanel({ clientId }: Props) {
  const { toast } = useToast();
  const [relations, setRelations] = useState<FamilyRelationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Add form
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [relationType, setRelationType] = useState("SPOUSE");
  const [adding, setAdding] = useState(false);

  const fetchRelations = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}/family`);
    const data = await res.json();
    const built = buildFamilyRelations(clientId, data.relationsA, data.relationsB);
    setRelations(built);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchRelations();
  }, [fetchRelations]);

  // Search clients for adding relation
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/clients?search=${encodeURIComponent(searchTerm)}&limit=10`);
      const data = await res.json();
      setSearchResults(
        data.clients
          .filter((c: any) => c.id !== clientId)
          .map((c: any) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName }))
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, clientId]);

  async function handleAdd() {
    if (!selectedClientId) return;
    setAdding(true);
    const res = await fetch(`/api/clients/${clientId}/family`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientBId: selectedClientId, relationType }),
    });

    if (res.ok) {
      toast("קשר משפחתי נוסף בהצלחה");
      fetchRelations();
      setShowAdd(false);
      setSearchTerm("");
      setSelectedClientId("");
    } else {
      const data = await res.json();
      toast(data.error || "שגיאה בהוספת הקשר", "error");
    }
    setAdding(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/family-relations/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast("הקשר המשפחתי נמחק");
      fetchRelations();
    } else {
      toast("שגיאה במחיקת הקשר", "error");
    }
    setDeleting(false);
    setDeleteId(null);
  }

  const relationTypeOptions = [
    { value: "SPOUSE", label: relationLabels.SPOUSE },
    { value: "PARENT", label: relationLabels.PARENT },
    { value: "CHILD", label: relationLabels.CHILD },
    { value: "SIBLING", label: relationLabels.SIBLING },
  ];

  function closeAddModal() {
    setShowAdd(false);
    setSearchTerm("");
    setSelectedClientId("");
    setRelationType("SPOUSE");
    setSearchResults([]);
  }

  if (loading) return <TableSkeleton rows={3} cols={3} />;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowAdd(true)}>{labels.addRelation} +</Button>
      </div>

      {relations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          אין קשרי משפחה
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-border-light">
          <table className="w-full">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-start px-4 py-3 text-sm font-bold text-muted-foreground">{labels.relatedClient}</th>
                <th className="text-start px-4 py-3 text-sm font-bold text-muted-foreground">{labels.relationType}</th>
                <th className="text-start px-4 py-3 text-sm font-bold text-muted-foreground">{labels.actions}</th>
              </tr>
            </thead>
            <tbody>
              {relations.map((rel) => (
                <tr key={rel.id} className="border-b border-border-light">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${rel.relatedClientId}`} className="text-primary-600 hover:underline">
                      {rel.relatedClientName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-0.5 text-sm rounded-full bg-[#f8fafc] dark:bg-foreground/10 text-muted-foreground">
                      {relationLabels[rel.relationType]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" title={labels.delete} aria-label={labels.delete} onClick={() => setDeleteId(rel.id)}>
                      <span className="text-danger-600"><TrashIcon size={16} /></span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Relation Modal */}
      <Modal open={showAdd} onClose={closeAddModal} title={labels.addRelation}>
        <div className="space-y-4">
          <Input
            label="חיפוש לקוח"
            placeholder="הקלד שם לקוח..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedClientId("");
            }}
          />

          {searchResults.length > 0 && !selectedClientId && (
            <div className="border rounded-lg max-h-40 overflow-y-auto">
              {searchResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedClientId(c.id);
                    setSearchTerm(`${c.firstName} ${c.lastName}`);
                    setSearchResults([]);
                  }}
                  className="w-full text-start px-4 py-2 hover:bg-accent transition-colors"
                >
                  {c.firstName} {c.lastName}
                </button>
              ))}
            </div>
          )}

          <Select
            label={labels.relationType}
            options={relationTypeOptions}
            value={relationType}
            onChange={(e) => setRelationType(e.target.value)}
          />

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={closeAddModal}>
              {labels.cancel}
            </Button>
            <Button onClick={handleAdd} loading={adding} disabled={!selectedClientId}>
              {labels.add}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={labels.confirmDelete}
        message="האם למחוק קשר משפחתי זה?"
        loading={deleting}
      />
    </div>
  );
}
