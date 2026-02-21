"use client";

import { useState } from "react";
import Link from "next/link";
import { labels } from "@/lib/utils/hebrew";
import { formatDate } from "@/lib/utils/dates";

interface BirthdayClient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  birthMonth: number;
  gender: string | null;
}

interface Props {
  items: BirthdayClient[];
  currentMonth: number;
  nextMonth: number;
  currentMonthLabel: string;
  nextMonthLabel: string;
}

export function BirthdaysList({ items, currentMonth, nextMonth, currentMonthLabel, nextMonthLabel }: Props) {
  const [tab, setTab] = useState<number>(currentMonth);

  const filtered = items.filter((c) => c.birthMonth === tab);
  const now = new Date();

  const tabs = [
    { value: currentMonth, label: currentMonthLabel },
    { value: nextMonth, label: nextMonthLabel },
  ];

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border-light">
      <div className={`flex items-center justify-between ${filtered.length > 0 ? "mb-4" : ""}`}>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">{labels.birthdaysThisMonth}</h2>
          {filtered.length > 0 ? (
            <span className="text-sm bg-purple-500/15 text-purple-600 px-2 py-0.5 rounded-full font-medium">
              {filtered.length}
            </span>
          ) : (
            <span className="text-muted-foreground">{labels.noBirthdaysThisMonth}</span>
          )}
        </div>
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
      </div>

      {filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((client) => {
            const dob = new Date(client.dateOfBirth);
            const birthdayThisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const diffDays = Math.round((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const isPassed = diffDays < 0;
            const isToday = diffDays === 0;
            const age = now.getFullYear() - dob.getFullYear() - (isPassed || isToday ? 0 : 1);
            return (
              <div
                key={client.id}
                className={`flex items-center gap-3 py-3 px-4 rounded-lg ${isToday ? "bg-purple-500/10 border border-purple-500/30" : "bg-muted"}`}
              >
                <Link href={`/clients/${client.id}`} className="text-primary-600 hover:underline font-medium">
                  {client.firstName} {client.lastName}
                </Link>
                {isPassed && (
                  <span className="text-base text-muted-foreground">
                    {client.gender === "FEMALE" ? "חגגה" : "חגג"} {age} ב- {formatDate(birthdayThisYear)}
                  </span>
                )}
                {isToday && (
                  <span className="text-base font-bold text-fuchsia-400">
                    {client.gender === "FEMALE" ? "חוגגת" : "חוגג"} {age} היום! {formatDate(birthdayThisYear)}
                  </span>
                )}
                {!isToday && !isPassed && (
                  <span className="text-base text-muted-foreground">
                    {client.gender === "FEMALE" ? "תחגוג" : "יחגוג"} {age + 1} ב- {formatDate(birthdayThisYear)}, בעוד {diffDays} ימים
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
