"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { labels, categoryLabels } from "@/lib/utils/hebrew";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumbers: { id: string; number: string; label: string }[];
  _count: {
    vehicles: number;
    homes: number;
    businesses: number;
    healthPolicies: number;
    pensionPolicies: number;
  };
}

export function ClientListWrapper() {
  const router = useRouter();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    params.set("page", String(page));

    const res = await fetch(`/api/clients?${params}`);
    const data = await res.json();
    setClients(data.clients);
    setTotal(data.total);
    setLoading(false);
  }, [search, category, page]);

  useEffect(() => {
    const timer = setTimeout(fetchClients, 300);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/clients/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast("הלקוח נמחק בהצלחה");
      fetchClients();
    } else {
      toast("שגיאה במחיקת הלקוח", "error");
    }
    setDeleting(false);
    setDeleteId(null);
  }

  const categories = [
    { value: "", label: "הכל" },
    { value: "VEHICLE", label: categoryLabels.VEHICLE },
    { value: "HOME", label: categoryLabels.HOME },
    { value: "BUSINESS", label: categoryLabels.BUSINESS },
    { value: "HEALTH", label: categoryLabels.HEALTH },
    { value: "PENSION", label: categoryLabels.PENSION },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder={`${labels.search}...`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setCategory(cat.value); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                category === cat.value
                  ? "bg-primary-600 text-white"
                  : "bg-card text-muted-foreground border border-input-border hover:bg-accent"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <Link href="/clients/new">
          <Button className="h-full">{labels.newClient} +</Button>
        </Link>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : clients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">{labels.noResults}</p>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-xl shadow-sm border border-border-light overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-start px-4 py-3 text-sm font-bold text-muted-foreground">{labels.firstName}</th>
                  <th className="text-start px-4 py-3 text-sm font-bold text-muted-foreground">{labels.lastName}</th>
                  <th className="text-start px-4 py-3 text-sm font-bold text-muted-foreground">{labels.phoneNumber}</th>
                  <th className="text-start px-4 py-3 text-sm font-bold text-muted-foreground">{labels.email}</th>
                  <th className="text-start px-4 py-3 text-sm font-bold text-muted-foreground">{labels.insurance}</th>
                  <th className="text-start px-4 py-3 text-sm font-bold text-muted-foreground">{labels.actions}</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-border-light hover:bg-accent cursor-pointer"
                    onClick={() => router.push(`/clients/${client.id}`)}
                  >
                    <td className="px-4 py-3">
                      {client.firstName}
                    </td>
                    <td className="px-4 py-3">{client.lastName}</td>
                    <td className="px-4 py-3 text-sm">
                      <span dir="ltr">{client.phoneNumbers[0]?.number || "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span dir="ltr">{client.email || "-"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {client._count.vehicles > 0 && (
                          <span className="px-3 py-0.5 text-sm rounded-full bg-foreground/10 text-muted-foreground">
                            {categoryLabels.VEHICLE} ({client._count.vehicles})
                          </span>
                        )}
                        {client._count.homes > 0 && (
                          <span className="px-3 py-0.5 text-sm rounded-full bg-foreground/10 text-muted-foreground">
                            {categoryLabels.HOME} ({client._count.homes})
                          </span>
                        )}
                        {client._count.businesses > 0 && (
                          <span className="px-3 py-0.5 text-sm rounded-full bg-foreground/10 text-muted-foreground">
                            {categoryLabels.BUSINESS} ({client._count.businesses})
                          </span>
                        )}
                        {client._count.healthPolicies > 0 && (
                          <span className="px-3 py-0.5 text-sm rounded-full bg-foreground/10 text-muted-foreground">
                            {categoryLabels.HEALTH} ({client._count.healthPolicies})
                          </span>
                        )}
                        {client._count.pensionPolicies > 0 && (
                          <span className="px-3 py-0.5 text-sm rounded-full bg-foreground/10 text-muted-foreground">
                            {categoryLabels.PENSION} ({client._count.pensionPolicies})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(client.id); }}
                        className="text-sm text-danger-600 hover:underline"
                      >
                        {labels.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 20 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                הקודם
              </Button>
              <span className="px-4 py-2 text-sm text-muted-foreground">
                עמוד {page} מתוך {Math.ceil(total / 20)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= Math.ceil(total / 20)}
                onClick={() => setPage((p) => p + 1)}
              >
                הבא
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={labels.confirmDelete}
        message="האם אתה בטוח שברצונך למחוק לקוח זה? כל הנתונים הקשורים ימחקו."
        loading={deleting}
      />
    </div>
  );
}
