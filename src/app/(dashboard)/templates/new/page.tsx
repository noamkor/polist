import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NewTemplateForm } from "@/components/templates/NewTemplateForm";
import { labels } from "@/lib/utils/hebrew";

export default async function NewTemplatePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{labels.newTemplate}</h1>
      <div className="bg-card rounded-xl shadow-sm border border-border-light p-6 max-w-2xl">
        <NewTemplateForm />
      </div>
    </div>
  );
}
