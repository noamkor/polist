"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Autocomplete } from "@/components/ui/Autocomplete";
import { labels } from "@/lib/utils/hebrew";
import { sanitizeFileNameInput } from "@/lib/utils/file-name";

interface ClientLite {
  id: string;
  firstName: string;
  lastName: string;
}

interface InsuranceRecord {
  id: string;
  year: number;
}

interface AssetWithInsurance {
  id: string;
  insurance?: InsuranceRecord[];
  // discriminator labels per asset
  licensePlate?: string;
  address?: string;
  businessName?: string;
  policyName?: string;
}

interface ClientFull {
  id: string;
  firstName: string;
  lastName: string;
  vehicles: AssetWithInsurance[];
  homes: AssetWithInsurance[];
  businesses: AssetWithInsurance[];
  healthPolicies: AssetWithInsurance[];
  pensionPolicies: AssetWithInsurance[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  templateId: string;
  templateName: string;
  values: Record<string, string>;
}

type AttachType =
  | "personal"
  | "vehicleInsurance"
  | "homeInsurance"
  | "businessInsurance"
  | "healthInsurance"
  | "pensionInsurance";

const TYPE_OPTIONS: { value: AttachType; label: string }[] = [
  { value: "personal", label: "מסמך אישי" },
  { value: "vehicleInsurance", label: "ביטוח רכב" },
  { value: "homeInsurance", label: "ביטוח דירה" },
  { value: "businessInsurance", label: "ביטוח עסק" },
  { value: "healthInsurance", label: "ביטוח בריאות" },
  { value: "pensionInsurance", label: "ביטוח פנסיה" },
];

const CATEGORY_BY_TYPE: Record<AttachType, string | null> = {
  personal: null,
  vehicleInsurance: "VEHICLE",
  homeInsurance: "HOME",
  businessInsurance: "BUSINESS",
  healthInsurance: "HEALTH",
  pensionInsurance: "PENSION",
};

const PERSONAL_DOC_TYPES: { value: string; label: string }[] = [
  { value: "", label: "מסמך נוסף" },
  { value: "ID", label: "תעודת זהות" },
  { value: "DRIVER_LICENSE", label: "רישיון נהיגה" },
];

function assetLabel(type: AttachType, asset: AssetWithInsurance): string {
  switch (type) {
    case "vehicleInsurance":
      return asset.licensePlate || asset.id;
    case "homeInsurance":
      return asset.address || asset.id;
    case "businessInsurance":
      return asset.businessName || asset.id;
    case "healthInsurance":
    case "pensionInsurance":
      return asset.policyName || asset.id;
    default:
      return asset.id;
  }
}

function getAssetsForType(client: ClientFull | null, type: AttachType): AssetWithInsurance[] {
  if (!client) return [];
  switch (type) {
    case "vehicleInsurance":
      return client.vehicles;
    case "homeInsurance":
      return client.homes;
    case "businessInsurance":
      return client.businesses;
    case "healthInsurance":
      return client.healthPolicies;
    case "pensionInsurance":
      return client.pensionPolicies;
    default:
      return [];
  }
}

export function AttachToClientDialog({ open, onClose, templateId, templateName, values }: Props) {
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientFull, setClientFull] = useState<ClientFull | null>(null);
  const [type, setType] = useState<AttachType>("personal");
  const [personalDocType, setPersonalDocType] = useState("");
  const [assetId, setAssetId] = useState("");
  const [recordId, setRecordId] = useState("");
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFileName(templateName);
    setClientSearch("");
    setSelectedClientId(null);
    setClientFull(null);
    setType("personal");
    setPersonalDocType("");
    setAssetId("");
    setRecordId("");
    fetch("/api/clients?limit=500")
      .then((r) => r.json())
      .then((data) => {
        const list = data.clients || data;
        setClients(Array.isArray(list) ? list : []);
      })
      .catch(() => setClients([]));
  }, [open, templateName]);

  useEffect(() => {
    if (!selectedClientId) {
      setClientFull(null);
      return;
    }
    fetch(`/api/clients/${selectedClientId}`)
      .then((r) => r.json())
      .then((data) => setClientFull(data))
      .catch(() => setClientFull(null));
    setAssetId("");
    setRecordId("");
  }, [selectedClientId]);

  useEffect(() => {
    setAssetId("");
    setRecordId("");
  }, [type]);

  useEffect(() => {
    setRecordId("");
  }, [assetId]);

  const clientNames = clients.map((c) => `${c.firstName} ${c.lastName}`);

  function pickClient(name: string) {
    setClientSearch(name);
    const found = clients.find((c) => `${c.firstName} ${c.lastName}` === name);
    setSelectedClientId(found?.id || null);
  }

  const assets = useMemo(() => getAssetsForType(clientFull, type), [clientFull, type]);
  const selectedAsset = assets.find((a) => a.id === assetId) || null;
  const insuranceRecords = selectedAsset?.insurance || [];

  const isInsuranceType = type !== "personal";
  const canSubmit =
    !!selectedClientId &&
    (!isInsuranceType || (assetId && recordId));

  async function handleAttach() {
    if (!selectedClientId) {
      toast("יש לבחור לקוח", "error");
      return;
    }
    if (isInsuranceType && (!assetId || !recordId)) {
      toast("יש לבחור נכס ושנה", "error");
      return;
    }
    setSubmitting(true);
    try {
      const record = insuranceRecords.find((r) => r.id === recordId);
      const payload: Record<string, unknown> = {
        clientId: selectedClientId,
        type,
        category: CATEGORY_BY_TYPE[type],
      };
      if (type === "personal") {
        payload.personalDocType = personalDocType || undefined;
      } else {
        payload.assetId = assetId;
        payload.recordId = recordId;
        payload.year = record?.year;
      }
      const res = await fetch(`/api/templates/${templateId}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values,
          fileName: fileName.trim() || templateName,
          attach: payload,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      toast("המסמך נשמר וצורף ללקוח");
      onClose();
    } catch (err) {
      console.error(err);
      toast("שגיאה בשמירה", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={labels.saveAndAttach}>
      <div className="space-y-4">
        <Autocomplete
          label={labels.selectClient}
          value={clientSearch}
          onChange={pickClient}
          options={clientNames}
        />

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">סוג המסמך</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AttachType)}
            className="w-full px-3 py-2 rounded-lg border border-input-border bg-card focus:ring-primary-500 outline-none focus:ring-2 text-sm"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {type === "personal" && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">סיווג</label>
            <select
              value={personalDocType}
              onChange={(e) => setPersonalDocType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input-border bg-card focus:ring-primary-500 outline-none focus:ring-2 text-sm"
            >
              {PERSONAL_DOC_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {isInsuranceType && selectedClientId && (
          <>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">נכס</label>
              {assets.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  אין נכסים מסוג זה ללקוח. הוסף תחילה ללקוח.
                </p>
              ) : (
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input-border bg-card focus:ring-primary-500 outline-none focus:ring-2 text-sm"
                >
                  <option value="">— בחר נכס —</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {assetLabel(type, a)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {assetId && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">שנה</label>
                {insuranceRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    אין רשומות ביטוח לנכס זה. הוסף תחילה רשומת ביטוח.
                  </p>
                ) : (
                  <select
                    value={recordId}
                    onChange={(e) => setRecordId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-input-border bg-card focus:ring-primary-500 outline-none focus:ring-2 text-sm"
                  >
                    <option value="">— בחר שנה —</option>
                    {insuranceRecords
                      .slice()
                      .sort((a, b) => b.year - a.year)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.year}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            )}
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">שם הקובץ</label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(sanitizeFileNameInput(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-input-border bg-card focus:ring-primary-500 outline-none focus:ring-2 text-sm"
          />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {labels.cancel}
          </Button>
          <Button onClick={handleAttach} loading={submitting} disabled={!canSubmit}>
            {labels.saveAndAttach}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
