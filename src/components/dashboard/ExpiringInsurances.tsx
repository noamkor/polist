"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { labels, categoryLabels } from "@/lib/utils/hebrew";
import { formatDate } from "@/lib/utils/dates";
import { useToast } from "@/components/ui/Toast";

interface ExpiringInsurance {
  id: string;
  year: number;
  endDate: string;
  provider: string | null;
  policyNumber: string | null;
  premium: number | null;
  category: string;
  assetId: string;
  assetLabel: string;
  clientName: string;
  clientId: string;
}

interface Props {
  items: ExpiringInsurance[];
}

const RANGE_OPTIONS = [
  { value: 30, label: labels.days30 },
  { value: 60, label: labels.days60 },
  { value: 90, label: labels.days90 },
];

function getDaysLeft(endDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getDotColor(daysLeft: number): string {
  if (daysLeft <= 0) return "bg-red-500";
  if (daysLeft <= 3) return "bg-red-400";
  if (daysLeft <= 7) return "bg-orange-500";
  if (daysLeft <= 14) return "bg-orange-400";
  if (daysLeft <= 30) return "bg-amber-400";
  return "bg-yellow-300";
}

function getDotPulse(daysLeft: number): string {
  if (daysLeft <= 3) return "animate-pulse";
  return "";
}

export function ExpiringInsurances({ items }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [range, setRange] = useState(30);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [renewedIds, setRenewedIds] = useState<Set<string>>(new Set());

  const filtered = items.filter((ins) => {
    const days = getDaysLeft(ins.endDate);
    return days <= range;
  });

  async function handleRenew(ins: ExpiringInsurance) {
    setRenewingId(ins.id);
    const res = await fetch("/api/insurance/renew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: ins.category,
        assetId: ins.assetId,
        year: ins.year,
        provider: ins.provider,
        policyNumber: ins.policyNumber,
        premium: ins.premium,
        endDate: ins.endDate,
      }),
    });

    if (res.ok) {
      toast(`ביטוח חודש לשנת ${ins.year + 1}`);
      setRenewedIds((prev) => new Set(prev).add(ins.id));
      router.refresh();
    } else {
      const data = await res.json();
      toast(data.error || "שגיאה בחידוש הביטוח", "error");
    }
    setRenewingId(null);
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border-light mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">{labels.expiringInsurances}</h2>
          {filtered.length > 0 && (
            <span className="text-sm bg-red-500/15 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {filtered.length} {labels.expiringThisMonth}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                range === opt.value
                  ? "bg-primary-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-muted rounded-lg">
          {labels.noExpiringInsurances}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start py-2 text-sm font-bold text-muted-foreground w-8"></th>
                <th className="text-start py-2 text-sm font-bold text-muted-foreground">{labels.clientName}</th>
                <th className="text-start py-2 text-sm font-bold text-muted-foreground">{labels.insuranceType}</th>
                <th className="text-start py-2 text-sm font-bold text-muted-foreground">{labels.assetDetails}</th>
                <th className="text-start py-2 text-sm font-bold text-muted-foreground">{labels.provider}</th>
                <th className="text-start py-2 text-sm font-bold text-muted-foreground">{labels.expiresOn}</th>
                <th className="text-start py-2 text-sm font-bold text-muted-foreground">{labels.daysLeft}</th>
                <th className="text-start py-2 text-sm font-bold text-muted-foreground w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ins) => {
                const days = getDaysLeft(ins.endDate);
                const isRenewed = renewedIds.has(ins.id);
                const isRenewing = renewingId === ins.id;
                return (
                  <tr key={ins.id} className="border-b border-border-light hover:bg-accent transition-colors">
                    <td className="py-3">
                      <span className={`inline-block w-3 h-3 rounded-full ${getDotColor(days)} ${getDotPulse(days)}`} />
                    </td>
                    <td className="py-3">
                      <Link href={`/clients/${ins.clientId}`} className="text-primary-600 hover:underline font-medium">
                        {ins.clientName}
                      </Link>
                    </td>
                    <td className="py-3">
                      <span className="px-3 py-0.5 text-sm rounded-full bg-foreground/10 text-muted-foreground">
                        {categoryLabels[ins.category]}
                      </span>
                    </td>
                    <td className="py-3 text-sm">{ins.assetLabel}</td>
                    <td className="py-3 text-sm text-muted-foreground">{ins.provider || "—"}</td>
                    <td className="py-3 text-sm">{formatDate(ins.endDate)}</td>
                    <td className="py-3">
                      <span className={`text-sm font-medium ${days <= 3 ? "text-red-600" : days <= 7 ? "text-orange-600" : days <= 30 ? "text-amber-600" : "text-yellow-600"}`}>
                        {days <= 0 ? "פג תוקף!" : `${days} ימים`}
                      </span>
                    </td>
                    <td className="py-3">
                      {isRenewed ? (
                        <span className="text-sm text-green-600 font-medium">{labels.renewed}</span>
                      ) : (
                        <button
                          onClick={() => handleRenew(ins)}
                          disabled={isRenewing}
                          className="text-sm text-primary-600 hover:underline font-medium disabled:opacity-50 cursor-pointer"
                        >
                          {isRenewing ? labels.renewing : labels.renew}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
