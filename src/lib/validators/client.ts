import { z } from "zod";

export const phoneNumberSchema = z.object({
  id: z.string().optional(),
  number: z.string().min(1, "מספר טלפון הוא שדה חובה"),
  label: z.string().default("נייד"),
});

export const clientSchema = z.object({
  firstName: z.string().min(1, "שם פרטי הוא שדה חובה"),
  lastName: z.string().min(1, "שם משפחה הוא שדה חובה"),
  idNumber: z.string().nullable().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).nullable().optional(),
  email: z.string().email("כתובת דוא\"ל לא תקינה").nullable().optional().or(z.literal("")),
  dateOfBirth: z.string().nullable().optional().or(z.literal("")),
  address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  phoneNumbers: z.array(phoneNumberSchema).optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const familyRelationSchema = z.object({
  clientBId: z.string().min(1, "יש לבחור לקוח"),
  relationType: z.enum(["SPOUSE", "PARENT", "CHILD", "SIBLING"]),
});

export type FamilyRelationInput = z.infer<typeof familyRelationSchema>;
