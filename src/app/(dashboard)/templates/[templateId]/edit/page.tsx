import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TemplateEditor } from "@/components/templates/TemplateEditor";

interface Props {
  params: Promise<{ templateId: string }>;
}

export default async function EditTemplatePage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const { templateId } = await params;
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { id: true, name: true },
  });
  if (!template) notFound();

  return (
    <div className="-m-6 h-[calc(100vh-4rem)]">
      <TemplateEditor templateId={template.id} templateName={template.name} />
    </div>
  );
}
