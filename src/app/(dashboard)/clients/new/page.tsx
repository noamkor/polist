import { verifySession } from "@/lib/dal";
import { labels } from "@/lib/utils/hebrew";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ClientForm } from "@/components/clients/ClientForm";

export default async function NewClientPage() {
  await verifySession();

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: labels.clients, href: "/clients" },
          { label: labels.newClient },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6">{labels.newClient}</h1>
      <ClientForm />
    </div>
  );
}
