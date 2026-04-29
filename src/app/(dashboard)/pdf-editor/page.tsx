import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PdfEditor } from "@/components/pdf-editor/PdfEditor";

interface Props {
  searchParams: Promise<{ documentId?: string; redirect?: string }>;
}

export default async function PdfEditorPage({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const { documentId, redirect: redirectAfterSave } = await searchParams;

  return (
    <div className="-m-6 h-[calc(100vh-4rem)]">
      <PdfEditor
        key={documentId || "new"}
        initialDocumentId={documentId}
        redirectAfterSave={redirectAfterSave}
      />
    </div>
  );
}
