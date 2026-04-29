"use client";

import { useState } from "react";
import Link from "next/link";
import { labels, categoryLabels } from "@/lib/utils/hebrew";

interface ClientRef {
  id: string;
  firstName: string;
  lastName: string;
}

interface PotentialRelation {
  id1: string;
  firstName1: string;
  id2: string;
  firstName2: string;
  lastName: string;
}

interface UninsuredAsset {
  category: string;
  assetLabel: string;
  clientId: string;
  clientName: string;
}

interface MissingDatesRecord {
  category: string;
  year: number;
  assetLabel: string;
  clientId: string;
  clientName: string;
}

interface Props {
  noInsuranceClients: ClientRef[];
  potentialRelations: PotentialRelation[];
  missingContactClients: ClientRef[];
  missingBirthdayClients: ClientRef[];
  uninsuredAssets: UninsuredAsset[];
  missingDatesRecords: MissingDatesRecord[];
}

const categoryRoute: Record<string, string> = {
  VEHICLE: "vehicles",
  HOME: "homes",
  BUSINESS: "businesses",
  HEALTH: "health",
  PENSION: "pension",
};

export function AdvisorPanel({
  noInsuranceClients,
  potentialRelations,
  missingContactClients,
  missingBirthdayClients,
  uninsuredAssets,
  missingDatesRecords,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const insights = [
    {
      id: "no-insurance",
      color: "bg-red-500",
      title: labels.noInsuranceTitle,
      description: labels.noInsuranceDesc,
      count: noInsuranceClients.length,
      content: (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {noInsuranceClients.map((c) => (
            <Link key={c.id} href={`/clients/${c.id}`} className="text-primary-600 hover:underline text-sm">
              {c.firstName} {c.lastName}
            </Link>
          ))}
        </div>
      ),
    },
    {
      id: "assets-no-records",
      color: "bg-red-400",
      title: labels.assetsNoRecordsTitle,
      description: labels.assetsNoRecordsDesc,
      count: uninsuredAssets.length,
      content: (
        <div className="space-y-1.5">
          {uninsuredAssets.map((a, i) => (
            <Link key={i} href={`/clients/${a.clientId}/${categoryRoute[a.category]}`} className="text-sm flex items-center gap-2 hover:bg-accent rounded px-1 py-0.5 -mx-1 transition-colors">
              <span className="px-2 py-0.5 rounded-full bg-[#f8fafc] dark:bg-foreground/10 text-muted-foreground">
                {categoryLabels[a.category]}
              </span>
              <span>{a.assetLabel}</span>
              <span className="text-muted-foreground">—</span>
              <span className="text-primary-600">{a.clientName}</span>
            </Link>
          ))}
        </div>
      ),
    },
    {
      id: "missing-dates",
      color: "bg-orange-500",
      title: labels.missingDatesTitle,
      description: labels.missingDatesDesc,
      count: missingDatesRecords.length,
      content: (
        <div className="space-y-1.5">
          {missingDatesRecords.map((r, i) => (
            <Link key={i} href={`/clients/${r.clientId}/${categoryRoute[r.category]}`} className="text-sm flex items-center gap-2 hover:bg-accent rounded px-1 py-0.5 -mx-1 transition-colors">
              <span className="px-2 py-0.5 rounded-full bg-[#f8fafc] dark:bg-foreground/10 text-muted-foreground">
                {categoryLabels[r.category]}
              </span>
              <span>{r.assetLabel}</span>
              <span className="text-muted-foreground">({r.year})</span>
              <span className="text-muted-foreground">—</span>
              <span className="text-primary-600">{r.clientName}</span>
            </Link>
          ))}
        </div>
      ),
    },
    {
      id: "missing-contact",
      color: "bg-amber-500",
      title: labels.missingContactTitle,
      description: labels.missingContactDesc,
      count: missingContactClients.length,
      content: (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {missingContactClients.map((c) => (
            <Link key={c.id} href={`/clients/${c.id}/edit`} className="text-primary-600 hover:underline text-sm">
              {c.firstName} {c.lastName}
            </Link>
          ))}
        </div>
      ),
    },
    {
      id: "missing-birthday",
      color: "bg-orange-400",
      title: labels.missingBirthdayTitle,
      description: labels.missingBirthdayDesc,
      count: missingBirthdayClients.length,
      content: (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {missingBirthdayClients.map((c) => (
            <Link key={c.id} href={`/clients/${c.id}/edit`} className="text-primary-600 hover:underline text-sm">
              {c.firstName} {c.lastName}
            </Link>
          ))}
        </div>
      ),
    },
    {
      id: "potential-relations",
      color: "bg-blue-500",
      title: labels.potentialRelationsTitle,
      description: labels.potentialRelationsDesc,
      count: potentialRelations.length,
      content: (
        <div className="space-y-1.5">
          {potentialRelations.map((rel, i) => (
            <div key={i} className="text-sm flex items-center gap-2">
              <Link href={`/clients/${rel.id1}/family`} className="text-primary-600 hover:underline">
                {rel.firstName1} {rel.lastName}
              </Link>
              <span className="text-muted-foreground">&harr;</span>
              <Link href={`/clients/${rel.id2}/family`} className="text-primary-600 hover:underline">
                {rel.firstName2} {rel.lastName}
              </Link>
            </div>
          ))}
        </div>
      ),
    },
  ].filter((i) => i.count > 0);

  if (insights.length === 0) {
    return (
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border-light mb-6 flex items-center gap-3">
        <h2 className="text-lg font-bold">{labels.advisorTitle}</h2>
        <span className="text-muted-foreground">{labels.advisorAllGood}</span>
      </div>
    );
  }

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border-light mb-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold">{labels.advisorTitle}</h2>
        <span className="text-sm bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded-full font-medium">
          {insights.length} {labels.advisorRecommendations}
        </span>
      </div>
      <div className="space-y-2">
        {insights.map((insight) => (
          <div key={insight.id} className="rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => toggle(insight.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${insight.color} shrink-0`} />
                <span className="font-medium">{insight.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm bg-[#f8fafc] dark:bg-foreground/10 text-muted-foreground px-2 py-0.5 rounded-full">
                  {insight.count}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${expandedId === insight.id ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {expandedId === insight.id && (
              <div className="px-4 pb-3 border-t border-border-light">
                <p className="text-sm text-muted-foreground py-2">{insight.description}</p>
                {insight.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
