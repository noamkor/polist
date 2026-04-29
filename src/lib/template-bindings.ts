import { calculateAge, formatDate } from "@/lib/utils/dates";
import { genderLabels } from "@/lib/utils/hebrew";

export const BINDING_OPTIONS = [
  { key: "fullName", label: "שם מלא" },
  { key: "firstName", label: "שם פרטי" },
  { key: "lastName", label: "שם משפחה" },
  { key: "idNumber", label: "תעודת זהות" },
  { key: "gender", label: "מגדר" },
  { key: "dateOfBirth", label: "תאריך לידה" },
  { key: "age", label: "גיל" },
  { key: "email", label: 'דוא"ל' },
  { key: "address", label: "כתובת" },
  { key: "notes", label: "הערות" },
  { key: "phonePrimary", label: "טלפון" },
  { key: "phoneSecondary", label: "טלפון נוסף" },
] as const;

export type BindingKey = (typeof BINDING_OPTIONS)[number]["key"];

const VALID_BINDINGS = new Set<string>(BINDING_OPTIONS.map((b) => b.key));

export function isBindingKey(v: unknown): v is BindingKey {
  return typeof v === "string" && VALID_BINDINGS.has(v);
}

export interface ClientForBinding {
  firstName?: string | null;
  lastName?: string | null;
  idNumber?: string | null;
  gender?: string | null;
  dateOfBirth?: string | Date | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  phoneNumbers?: { number: string }[] | null;
}

export function resolveBinding(key: BindingKey, client: ClientForBinding | null): string {
  if (!client) return "";
  switch (key) {
    case "fullName":
      return [client.firstName, client.lastName].filter(Boolean).join(" ").trim();
    case "firstName":
      return client.firstName || "";
    case "lastName":
      return client.lastName || "";
    case "idNumber":
      return client.idNumber || "";
    case "gender":
      return client.gender ? genderLabels[client.gender] || "" : "";
    case "dateOfBirth":
      return formatDate(client.dateOfBirth);
    case "age": {
      const age = calculateAge(client.dateOfBirth);
      return age == null ? "" : String(age);
    }
    case "email":
      return client.email || "";
    case "address":
      return client.address || "";
    case "notes":
      return client.notes || "";
    case "phonePrimary":
      return client.phoneNumbers?.[0]?.number || "";
    case "phoneSecondary":
      return client.phoneNumbers?.[1]?.number || "";
  }
}
