import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { labels } from "@/lib/utils/hebrew";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PensionManager } from "@/components/insurance/PensionManager";

export default async function PensionPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  await verifySession();
  const { clientId } = await params;
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!client) notFound();

  return (
    <div>
      <Breadcrumbs items={[
        { label: labels.clients, href: "/clients" },
        { label: `${client.firstName} ${client.lastName}`, href: `/clients/${clientId}` },
        { label: labels.pension },
      ]} />
      <h1 className="text-2xl font-bold mb-6">{labels.pension}</h1>
      <PensionManager clientId={clientId} />
    </div>
  );
}
