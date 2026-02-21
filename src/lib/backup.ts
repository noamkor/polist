import archiver from "archiver";
import { prisma } from "./prisma";
import { existsSync, createReadStream } from "fs";
import { PassThrough } from "stream";
import { categoryLabels } from "./utils/hebrew";

function formatDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function generateBackupStream(): Promise<PassThrough> {
  const passthrough = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 5 } });

  archive.pipe(passthrough);

  const clients = await prisma.client.findMany({
    include: {
      phoneNumbers: true,
      vehicles: {
        include: { insurance: { include: { documents: true } } },
      },
      homes: {
        include: { insurance: { include: { documents: true } } },
      },
      businesses: {
        include: { insurance: { include: { documents: true } } },
      },
      healthPolicies: {
        include: { insurance: { include: { documents: true } } },
      },
      pensionPolicies: {
        include: { insurance: { include: { documents: true } } },
      },
      documents: true,
    },
    orderBy: { lastName: "asc" },
  });

  const dateStr = formatDate();
  const rootDir = `גיבוי-${dateStr}`;

  for (const client of clients) {
    const clientDir = `${rootDir}/לקוחות/${client.lastName}-${client.firstName}`;

    // Client info JSON
    const info = {
      שם_פרטי: client.firstName,
      שם_משפחה: client.lastName,
      דואל: client.email,
      כתובת: client.address,
      הערות: client.notes,
      טלפונים: client.phoneNumbers.map((p) => `${p.number} (${p.label})`),
    };
    archive.append(JSON.stringify(info, null, 2), {
      name: `${clientDir}/פרטי-לקוח.json`,
    });

    // Personal documents
    for (const doc of client.documents) {
      if (existsSync(doc.storagePath)) {
        archive.append(createReadStream(doc.storagePath), {
          name: `${clientDir}/מסמכים-אישיים/${doc.fileName}`,
        });
      }
    }

    // Vehicle insurance docs
    for (const vehicle of client.vehicles) {
      const vehicleDir = `${clientDir}/${categoryLabels.VEHICLE}/${vehicle.licensePlate}`;
      for (const ins of vehicle.insurance) {
        const yearDir = `${vehicleDir}/${ins.year}`;
        if (ins.documents.length === 0) {
          archive.append("", { name: `${yearDir}/` });
        }
        for (const doc of ins.documents) {
          if (existsSync(doc.storagePath)) {
            archive.append(createReadStream(doc.storagePath), {
              name: `${yearDir}/${doc.fileName}`,
            });
          }
        }
      }
    }

    // Home insurance docs
    for (const home of client.homes) {
      const homeDir = `${clientDir}/${categoryLabels.HOME}/${home.address}`;
      for (const ins of home.insurance) {
        const yearDir = `${homeDir}/${ins.year}`;
        if (ins.documents.length === 0) {
          archive.append("", { name: `${yearDir}/` });
        }
        for (const doc of ins.documents) {
          if (existsSync(doc.storagePath)) {
            archive.append(createReadStream(doc.storagePath), {
              name: `${yearDir}/${doc.fileName}`,
            });
          }
        }
      }
    }

    // Business insurance docs
    for (const biz of client.businesses) {
      const bizDir = `${clientDir}/${categoryLabels.BUSINESS}/${biz.businessName}`;
      for (const ins of biz.insurance) {
        const yearDir = `${bizDir}/${ins.year}`;
        if (ins.documents.length === 0) {
          archive.append("", { name: `${yearDir}/` });
        }
        for (const doc of ins.documents) {
          if (existsSync(doc.storagePath)) {
            archive.append(createReadStream(doc.storagePath), {
              name: `${yearDir}/${doc.fileName}`,
            });
          }
        }
      }
    }

    // Health insurance docs
    for (const policy of client.healthPolicies) {
      const healthDir = `${clientDir}/${categoryLabels.HEALTH}/${policy.policyName}`;
      for (const ins of policy.insurance) {
        const yearDir = `${healthDir}/${ins.year}`;
        if (ins.documents.length === 0) {
          archive.append("", { name: `${yearDir}/` });
        }
        for (const doc of ins.documents) {
          if (existsSync(doc.storagePath)) {
            archive.append(createReadStream(doc.storagePath), {
              name: `${yearDir}/${doc.fileName}`,
            });
          }
        }
      }
    }

    // Pension insurance docs
    for (const policy of client.pensionPolicies) {
      const pensionDir = `${clientDir}/${categoryLabels.PENSION}/${policy.policyName}`;
      for (const ins of policy.insurance) {
        const yearDir = `${pensionDir}/${ins.year}`;
        if (ins.documents.length === 0) {
          archive.append("", { name: `${yearDir}/` });
        }
        for (const doc of ins.documents) {
          if (existsSync(doc.storagePath)) {
            archive.append(createReadStream(doc.storagePath), {
              name: `${yearDir}/${doc.fileName}`,
            });
          }
        }
      }
    }
  }

  archive.finalize();

  return passthrough;
}
