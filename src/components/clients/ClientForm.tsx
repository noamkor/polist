"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { labels } from "@/lib/utils/hebrew";
import { toInputDate } from "@/lib/utils/dates";

interface PhoneEntry {
  id?: string;
  number: string;
  label: string;
}

interface ClientFormProps {
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    idNumber: string | null;
    gender: string | null;
    email: string | null;
    dateOfBirth: string | null;
    address: string | null;
    notes: string | null;
    phoneNumbers: PhoneEntry[];
  };
}

const genderOptions = [
  { value: "MALE", label: labels.male },
  { value: "FEMALE", label: labels.female },
  { value: "OTHER", label: labels.other },
];

const phoneLabelOptions = [
  { value: "נייד", label: "נייד" },
  { value: "בית", label: "בית" },
  { value: "עבודה", label: "עבודה" },
  { value: "פקס", label: "פקס" },
];

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    firstName: client?.firstName || "",
    lastName: client?.lastName || "",
    idNumber: client?.idNumber || "",
    gender: client?.gender || "",
    email: client?.email || "",
    dateOfBirth: client?.dateOfBirth ? toInputDate(client.dateOfBirth) : "",
    address: client?.address || "",
    notes: client?.notes || "",
  });

  const [phones, setPhones] = useState<PhoneEntry[]>(
    client?.phoneNumbers || [{ number: "", label: "נייד" }]
  );

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function addPhone() {
    setPhones((prev) => [...prev, { number: "", label: "נייד" }]);
  }

  function removePhone(index: number) {
    setPhones((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePhone(index: number, field: string, value: string) {
    setPhones((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const phoneNumbers = phones.filter((p) => p.number.trim());
    const body = {
      ...form,
      idNumber: form.idNumber || null,
      gender: form.gender || null,
      email: form.email || null,
      dateOfBirth: form.dateOfBirth || null,
      address: form.address || null,
      notes: form.notes || null,
      phoneNumbers,
    };

    const url = client ? `/api/clients/${client.id}` : "/api/clients";
    const method = client ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      toast(client ? "הלקוח עודכן בהצלחה" : "הלקוח נוצר בהצלחה");
      router.push(`/clients/${data.id}`);
      router.refresh();
    } else {
      const data = await res.json();
      if (data.error?.fieldErrors) {
        const fieldErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(data.error.fieldErrors)) {
          fieldErrors[key] = (msgs as string[])[0];
        }
        setErrors(fieldErrors);
      }
      toast("שגיאה בשמירת הלקוח", "error");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 shadow-sm border border-border-light max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Input
          id="firstName"
          label={labels.firstName}
          value={form.firstName}
          onChange={(e) => updateForm("firstName", e.target.value)}
          error={errors.firstName}
          required
        />
        <Input
          id="lastName"
          label={labels.lastName}
          value={form.lastName}
          onChange={(e) => updateForm("lastName", e.target.value)}
          error={errors.lastName}
          required
        />
        <Input
          id="idNumber"
          label={labels.idNumber}
          value={form.idNumber}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, "");
            updateForm("idNumber", val);
          }}
          dir="ltr"
        />
        <Select
          id="gender"
          label={labels.gender}
          options={genderOptions}
          placeholder="בחר..."
          value={form.gender}
          onChange={(e) => updateForm("gender", e.target.value)}
        />
        <Input
          id="email"
          label={labels.email}
          type="email"
          value={form.email}
          onChange={(e) => updateForm("email", e.target.value)}
          error={errors.email}
          dir="ltr"
        />
        <Input
          id="dateOfBirth"
          label={labels.dateOfBirth}
          type="date"
          value={form.dateOfBirth}
          onChange={(e) => updateForm("dateOfBirth", e.target.value)}
        />
        <Input
          id="address"
          label={labels.address}
          value={form.address}
          onChange={(e) => updateForm("address", e.target.value)}
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-1">{labels.notes}</label>
        <textarea
          className="w-full px-3 py-2 rounded-lg border border-input-border bg-card focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
          rows={3}
          value={form.notes}
          onChange={(e) => updateForm("notes", e.target.value)}
        />
      </div>

      {/* Phone Numbers */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">{labels.phoneNumbers}</label>
          <Button type="button" variant="ghost" size="sm" onClick={addPhone}>
            {labels.addPhone} +
          </Button>
        </div>
        <div className="space-y-2">
          {phones.map((phone, index) => (
            <div key={index} className="flex gap-2 items-center">
              <div className="flex-1">
                <Input
                  value={phone.number}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9\-+() ]/g, "");
                    updatePhone(index, "number", val);
                  }}
                  dir="ltr"
                />
              </div>
              <div className="w-28">
                <Select
                  options={phoneLabelOptions}
                  value={phone.label}
                  onChange={(e) => updatePhone(index, "label", e.target.value)}
                />
              </div>
              {phones.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removePhone(index)}>
                  <span className="text-danger-600">&times;</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {labels.save}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          {labels.cancel}
        </Button>
      </div>
    </form>
  );
}
