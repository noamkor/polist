"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { TrashIcon } from "@/components/ui/icons";
import { labels, roleLabels } from "@/lib/utils/hebrew";

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: Date;
}

interface Props {
  initialUsers: User[];
}

export function UserManagement({ initialUsers }: Props) {
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    role: "AGENT",
  });

  const roleOptions = [
    { value: "ADMIN", label: roleLabels.ADMIN },
    { value: "AGENT", label: roleLabels.AGENT },
    { value: "VIEWER", label: roleLabels.VIEWER },
  ];

  async function fetchUsers() {
    const res = await fetch("/api/auth/users");
    if (res.ok) setUsers(await res.json());
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);

    const res = await fetch("/api/auth/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast("המשתמש נוצר בהצלחה");
      fetchUsers();
      setShowAdd(false);
      setForm({ username: "", password: "", name: "", role: "AGENT" });
    } else {
      const data = await res.json();
      toast(data.error || "שגיאה ביצירת המשתמש", "error");
    }
    setAdding(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/auth/users/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast("המשתמש נמחק");
      fetchUsers();
    } else {
      const data = await res.json();
      toast(data.error || "שגיאה במחיקת המשתמש", "error");
    }
    setDeleting(false);
    setDeleteId(null);
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border-light">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{labels.userManagement}</h2>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          הוסף משתמש +
        </Button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-start py-2 text-sm font-bold text-muted-foreground">{labels.username}</th>
            <th className="text-start py-2 text-sm font-bold text-muted-foreground">שם</th>
            <th className="text-start py-2 text-sm font-bold text-muted-foreground">תפקיד</th>
            <th className="text-start py-2 text-sm font-bold text-muted-foreground">{labels.actions}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-border-light">
              <td className="py-2">{user.username}</td>
              <td className="py-2">{user.name}</td>
              <td className="py-2">
                <span className="px-3 py-0.5 text-sm rounded-full bg-[#f8fafc] dark:bg-foreground/10 text-muted-foreground">
                  {roleLabels[user.role] || user.role}
                </span>
              </td>
              <td className="py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  title={labels.delete}
                  aria-label={labels.delete}
                  onClick={() => setDeleteId(user.id)}
                >
                  <span className="text-danger-600"><TrashIcon size={16} /></span>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="הוסף משתמש">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label={labels.username}
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            required
            dir="ltr"
          />
          <Input
            label={labels.password}
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            dir="ltr"
          />
          <Input
            label="שם תצוגה"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Select
            label="תפקיד"
            options={roleOptions}
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" type="button" onClick={() => setShowAdd(false)}>
              {labels.cancel}
            </Button>
            <Button type="submit" loading={adding}>
              {labels.add}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={labels.confirmDelete}
        message="האם למחוק משתמש זה?"
        loading={deleting}
      />
    </div>
  );
}
