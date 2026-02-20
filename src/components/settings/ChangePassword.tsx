"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { labels } from "@/lib/utils/hebrew";

export function ChangePassword() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast("הסיסמאות אינן תואמות", "error");
      return;
    }

    if (form.newPassword.length < 6) {
      toast("הסיסמה חייבת להכיל לפחות 6 תווים", "error");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }),
    });

    if (res.ok) {
      toast("הסיסמה שונתה בהצלחה");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      const data = await res.json();
      toast(data.error || "שגיאה בשינוי הסיסמה", "error");
    }
    setLoading(false);
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border-light">
      <h2 className="text-lg font-bold mb-4">{labels.changePassword}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="currentPassword"
          label={labels.currentPassword}
          type="password"
          value={form.currentPassword}
          onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
          required
          dir="ltr"
        />
        <Input
          id="newPassword"
          label={labels.newPassword}
          type="password"
          value={form.newPassword}
          onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
          required
          dir="ltr"
        />
        <Input
          id="confirmPassword"
          label={labels.confirmPassword}
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          required
          dir="ltr"
        />
        <Button type="submit" loading={loading}>
          {labels.changePassword}
        </Button>
      </form>
    </div>
  );
}
