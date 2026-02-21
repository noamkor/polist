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
  endMonth: number;
  provider: string | null;
  policyNumber: string | null;
  premium: number | null;
  category: string;
  assetId: string;
  assetLabel: string;
  clientName: string;
  clientId: string;
  renewed: boolean;
}

interface Props {
  items: ExpiringInsurance[];
  currentMonth: number;
  nextMonth: number;
  currentMonthLabel: string;
  nextMonthLabel: string;
}

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

export function ExpiringInsurances({ items, currentMonth, nextMonth, currentMonthLabel, nextMonthLabel }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [tab, setTab] = useState<number>(currentMonth);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [renewedIds, setRenewedIds] = useState<Set<string>>(new Set());

  const tabs = [
    { value: currentMonth, label: currentMonthLabel },
    { value: nextMonth, label: nextMonthLabel },
  ];

  const filtered = items.filter((ins) => ins.endMonth === tab);

  function handlePrint() {
    const tabLabel = tabs.find((t) => t.value === tab)?.label || "";
    const todayStr = new Intl.DateTimeFormat("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date());

    const rows = filtered
      .map((ins) => {
        const days = getDaysLeft(ins.endDate);
        const daysText = days <= 0 ? "פג תוקף!" : `${days} ימים`;
        const endDateStr = new Intl.DateTimeFormat("he-IL", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(ins.endDate));

        const isRenewed = ins.renewed || renewedIds.has(ins.id);
        const statusText = isRenewed ? "חודש" : "לא חודש";
        const statusStyle = isRenewed
          ? "color: #16a34a; font-weight: 600;"
          : "color: #dc2626; font-weight: 600;";

        return `<tr>
          <td>${ins.clientName}</td>
          <td>${categoryLabels[ins.category]}</td>
          <td>${ins.assetLabel}</td>
          <td>${ins.provider || "—"}</td>
          <td>${ins.policyNumber || "—"}</td>
          <td>${endDateStr}</td>
          <td>${daysText}</td>
          <td style="${statusStyle}">${statusText}</td>
        </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>ביטוחים שפגים — ${tabLabel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, "Segoe UI", Tahoma, sans-serif; padding: 32px; color: #1e293b; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .subtitle { font-size: 14px; color: #64748b; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { background: #f1f5f9; font-weight: 700; text-align: right; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; }
    td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; }
    tr:nth-child(even) { background: #f8fafc; }
    .footer { margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: center; }
    @media print {
      body { padding: 16px; }
      .footer { position: fixed; bottom: 8px; left: 0; right: 0; }
    }
  </style>
</head>
<body>
  <h1>ביטוחים שפגים — ${tabLabel}</h1>
  <p class="subtitle">${todayStr} · ${filtered.length} רשומות</p>
  <table>
    <thead>
      <tr>
        <th>${labels.clientName}</th>
        <th>${labels.insuranceType}</th>
        <th>${labels.assetDetails}</th>
        <th>${labels.provider}</th>
        <th>${labels.policyNumber}</th>
        <th>${labels.expiresOn}</th>
        <th>${labels.daysLeft}</th>
        <th>סטטוס</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="footer">פוליסט — ${todayStr}</p>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  }

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
      const data = await res.json();
      if (data.alreadyRenewed) {
        toast(`ביטוח כבר חודש לשנת ${ins.year + 1}`);
      } else {
        toast(`ביטוח חודש לשנת ${ins.year + 1}`);
      }
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
              {filtered.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                  tab === t.value
                    ? "bg-primary-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {filtered.length > 0 && (
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-sm bg-muted text-muted-foreground hover:bg-accent transition-colors cursor-pointer flex items-center gap-1.5"
              title="הדפסה"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.25 7.034V3.375" />
              </svg>
              הדפסה
            </button>
          )}
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
                const isRenewed = ins.renewed || renewedIds.has(ins.id);
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
                      <span className="inline-block w-16 text-center px-3 py-0.5 text-sm rounded-full bg-foreground/10 text-muted-foreground">
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
                      {tab === currentMonth && (
                        isRenewed ? (
                          <span className="text-sm text-green-600 font-medium">{labels.renewed}</span>
                        ) : (
                          <button
                            onClick={() => handleRenew(ins)}
                            disabled={isRenewing}
                            className="text-sm text-primary-600 hover:underline font-medium disabled:opacity-50 cursor-pointer"
                          >
                            {isRenewing ? labels.renewing : labels.renew}
                          </button>
                        )
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
