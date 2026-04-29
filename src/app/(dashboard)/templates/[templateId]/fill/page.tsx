import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TemplateFiller } from "@/components/templates/TemplateFiller";

interface Props {
  params: Promise<{ templateId: string }>;
}

export default async function FillTemplatePage({ params }: Props) {
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
      <TemplateFiller templateId={template.id} templateName={template.name} />
    </div>
  );
}
