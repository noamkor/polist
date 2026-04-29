import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { labels } from "@/lib/utils/hebrew";
import { formatDate } from "@/lib/utils/dates";
import { TemplatesActions } from "@/components/templates/TemplatesActions";

export default async function TemplatesPage() {
  await verifySession();

  const templates = await prisma.template.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{labels.templates}</h1>
        <Link
          href="/templates/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm font-medium"
        >
          {labels.newTemplate} +
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm border border-border-light p-12 text-center text-muted-foreground">
          אין תבניות. צור תבנית חדשה כדי להתחיל.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => {
            const fieldCount = Array.isArray(tpl.fields) ? tpl.fields.length : 0;
            return (
              <div
                key={tpl.id}
                className="bg-card rounded-xl shadow-sm border border-border-light p-5 flex flex-col"
              >
                <h3 className="font-bold text-lg mb-1">{tpl.name}</h3>
                {tpl.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {tpl.description}
                  </p>
                )}
                <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                  <span>{fieldCount} {labels.fieldsCount}</span>
                  <span>·</span>
                  <span>{formatDate(tpl.updatedAt)}</span>
                </div>
                <div className="flex gap-2 mt-auto">
                  <Link
                    href={`/templates/${tpl.id}/fill`}
                    className="flex-1 text-center px-3 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 text-sm font-medium"
                  >
                    {labels.fillTemplate}
                  </Link>
                  <Link
                    href={`/templates/${tpl.id}/edit`}
                    className="px-3 py-2 rounded-md border border-input-border bg-card hover:bg-accent text-sm"
                  >
                    {labels.edit}
                  </Link>
                  <TemplatesActions templateId={tpl.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
