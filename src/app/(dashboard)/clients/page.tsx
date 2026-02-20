import { Suspense } from "react";
import { verifySession } from "@/lib/dal";
import { labels } from "@/lib/utils/hebrew";
import { ClientListWrapper } from "@/components/clients/ClientListWrapper";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default async function ClientsPage() {
  await verifySession();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{labels.clients}</h1>
      </div>
      <Suspense fallback={<TableSkeleton rows={8} cols={6} />}>
        <ClientListWrapper />
      </Suspense>
    </div>
  );
}
