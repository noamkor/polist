import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateBackupStream } from "@/lib/backup";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const stream = await generateBackupStream();

  const date = new Date().toISOString().split("T")[0];
  const fileName = `polist-backup-${date}.zip`;

  // Convert Node.js stream to web ReadableStream
  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      stream.on("end", () => {
        controller.close();
      });
      stream.on("error", (err: Error) => {
        controller.error(err);
      });
    },
  });

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
