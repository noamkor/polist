import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { labels } from "@/lib/utils/hebrew";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ClientForm } from "@/components/clients/ClientForm";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  await verifySession();
  const { clientId } = await params;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { phoneNumbers: true },
  });

  if (!client) notFound();

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: labels.clients, href: "/clients" },
          { label: `${client.firstName} ${client.lastName}`, href: `/clients/${clientId}` },
          { label: labels.editClient },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6">{labels.editClient}</h1>
      <ClientForm
        client={{
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          idNumber: client.idNumber,
          gender: client.gender,
          email: client.email,
          dateOfBirth: client.dateOfBirth?.toISOString() || null,
          address: client.address,
          notes: client.notes,
          phoneNumbers: client.phoneNumbers,
        }}
      />
    </div>
  );
}
