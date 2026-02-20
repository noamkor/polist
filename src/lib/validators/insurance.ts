import { z } from "zod";

export const vehicleSchema = z.object({
  licensePlate: z.string().min(1, "מספר רכב הוא שדה חובה"),
  manufacturer: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  year: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;

export const homeSchema = z.object({
  address: z.string().min(1, "כתובת היא שדה חובה"),
  notes: z.string().nullable().optional(),
});

export type HomeInput = z.infer<typeof homeSchema>;

export const businessSchema = z.object({
  businessName: z.string().min(1, "שם העסק הוא שדה חובה"),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type BusinessInput = z.infer<typeof businessSchema>;

export const healthPolicySchema = z.object({
  policyName: z.string().min(1, "שם הפוליסה הוא שדה חובה"),
  provider: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type HealthPolicyInput = z.infer<typeof healthPolicySchema>;

export const pensionPolicySchema = z.object({
  policyName: z.string().min(1, "שם הפוליסה הוא שדה חובה"),
  provider: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type PensionPolicyInput = z.infer<typeof pensionPolicySchema>;

export const insuranceYearSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  provider: z.string().nullable().optional(),
  policyNumber: z.string().nullable().optional(),
  startDate: z.string().nullable().optional().or(z.literal("")),
  endDate: z.string().nullable().optional().or(z.literal("")),
  premium: z.coerce.number().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type InsuranceYearInput = z.infer<typeof insuranceYearSchema>;

export const insuranceYearUpdateSchema = insuranceYearSchema.extend({
  id: z.string().min(1),
});

export type InsuranceYearUpdateInput = z.infer<typeof insuranceYearUpdateSchema>;
