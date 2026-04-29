import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { labels, categoryLabels, genderLabels, relationLabels } from "@/lib/utils/hebrew";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { formatDate, calculateAge } from "@/lib/utils/dates";
import { buildFamilyRelations } from "@/lib/family-relations";
import { ClientDetailActions } from "@/components/clients/ClientDetailActions";
import { PersonalDocuments } from "@/components/clients/PersonalDocuments";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  await verifySession();
  const { clientId } = await params;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      phoneNumbers: true,
      vehicles: { include: { _count: { select: { insurance: true } } } },
      homes: { include: { _count: { select: { insurance: true } } } },
      businesses: { include: { _count: { select: { insurance: true } } } },
      healthPolicies: { include: { _count: { select: { insurance: true } } } },
      pensionPolicies: { include: { _count: { select: { insurance: true } } } },
      familyRelationsA: {
        include: { clientB: { select: { id: true, firstName: true, lastName: true } } },
      },
      familyRelationsB: {
        include: { clientA: { select: { id: true, firstName: true, lastName: true } } },
      },
      documents: true,
    },
  });

  if (!client) notFound();

  const familyRelations = buildFamilyRelations(
    clientId,
    client.familyRelationsA,
    client.familyRelationsB
  );

  const sections = [
    { key: "vehicles", label: labels.vehicles, href: `/clients/${clientId}/vehicles`, count: client.vehicles.length },
    { key: "homes", label: labels.homes, href: `/clients/${clientId}/homes`, count: client.homes.length },
    { key: "businesses", label: labels.businesses, href: `/clients/${clientId}/businesses`, count: client.businesses.length },
    { key: "health", label: labels.health, href: `/clients/${clientId}/health`, count: client.healthPolicies.length },
    { key: "pension", label: labels.pension, href: `/clients/${clientId}/pension`, count: client.pensionPolicies.length },
    { key: "family", label: labels.familyRelations, href: `/clients/${clientId}/family`, count: familyRelations.length },
  ];

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: labels.clients, href: "/clients" },
          { label: `${client.firstName} ${client.lastName}` },
        ]}
      />

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            {client.firstName} {client.lastName}
          </h1>
          {client.gender && (
            <span
              className={`text-sm px-3 py-0.5 rounded-full ${
                client.gender === "MALE"
                  ? "bg-green-500/15 text-green-600"
                  : client.gender === "FEMALE"
                    ? "bg-pink-500/15 text-pink-600"
                    : "bg-[#f8fafc] dark:bg-foreground/10 text-muted-foreground"
              }`}
            >
              {genderLabels[client.gender]}
            </span>
          )}
        </div>
        <ClientDetailActions clientId={clientId} />
      </div>

      {/* Client Info Card */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border-light mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {client.idNumber && (
            <div>
              <p className="text-sm text-muted-foreground">{labels.idNumber}</p>
              <p dir="ltr" className="text-end">{client.idNumber}</p>
            </div>
          )}
          {client.email && (
            <div>
              <p className="text-sm text-muted-foreground">{labels.email}</p>
              <p dir="ltr" className="text-end">{client.email}</p>
            </div>
          )}
          {client.dateOfBirth && (
            <div>
              <p className="text-sm text-muted-foreground">{labels.dateOfBirth}</p>
              <p>
                {formatDate(client.dateOfBirth)}
                {(() => {
                  const age = calculateAge(client.dateOfBirth);
                  return age !== null ? (
                    <span className="text-muted-foreground"> ({labels.age} {age})</span>
                  ) : null;
                })()}
              </p>
            </div>
          )}
          {client.address && (
            <div>
              <p className="text-sm text-muted-foreground">{labels.address}</p>
              <p>{client.address}</p>
            </div>
          )}
          {client.phoneNumbers.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">{labels.phoneNumbers}</p>
              {client.phoneNumbers.map((p) => (
                <p key={p.id} dir="ltr" className="text-end">
                  {p.number} <span className="text-secondary-foreground text-sm">({p.label})</span>
                </p>
              ))}
            </div>
          )}
          {client.notes && (
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">{labels.notes}</p>
              <p className="whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Insurance Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {sections.map((section) => (
          <Link
            key={section.key}
            href={section.href}
            className="bg-card rounded-xl p-5 shadow-sm border border-border-light hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{section.label}</h3>
              <span className={`w-7 h-7 rounded-full text-sm font-medium inline-flex items-center justify-center ${
                section.count > 0
                  ? "bg-primary-500/15 text-primary-600"
                  : "bg-[#f8fafc] dark:bg-foreground/10 text-muted-foreground"
              }`}>
                {section.count}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Personal Documents */}
      <div className="mb-6">
        <PersonalDocuments clientId={clientId} />
      </div>

      {/* Family Relations Quick View */}
      {familyRelations.length > 0 && (
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border-light">
          <h3 className="font-bold mb-3">{labels.familyRelations}</h3>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
            {familyRelations.map((rel) => (
              <div key={rel.id} className="contents">
                <span className="inline-block w-24 text-center px-3 py-0.5 text-sm rounded-full bg-[#f8fafc] dark:bg-foreground/10 text-muted-foreground">
                  {relationLabels[rel.relationType]}
                </span>
                <Link
                  href={`/clients/${rel.relatedClientId}`}
                  className="text-primary-600 hover:underline"
                >
                  {rel.relatedClientName}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
