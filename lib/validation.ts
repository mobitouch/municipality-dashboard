import { z } from "zod";

import {
  PRIORITIES,
  REQUEST_KINDS,
  REQUEST_SOURCES,
  REQUEST_STATUSES,
  USER_ROLES,
} from "./types";

/** Empty form fields arrive as "" — treat them as "not provided". */
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? "" : value));

const optionalId = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable();

const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value === "" || z.email().safeParse(value).success, {
    message: "Enter a valid email address.",
  });

const phone = z
  .string()
  .trim()
  .max(40, "Phone number is too long.")
  .refine((value) => value === "" || /^[0-9+()\-.\s]{6,40}$/.test(value), {
    message: "Enter a valid phone number.",
  });

export const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
  .optional()
  .transform((value) => value === "on" || value === "true");

export const departmentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  headOfDepartment: optionalText.pipe(z.string().max(80)),
  description: optionalText.pipe(z.string().max(500)),
  email: optionalEmail,
  phone,
  isActive: checkbox,
});

export const staffSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  role: optionalText.pipe(z.string().max(80)),
  departmentId: z.string().trim().min(1, "Choose a department."),
  email: optionalEmail,
  phone,
  isActive: checkbox,
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  kind: z.enum(REQUEST_KINDS),
  defaultDepartmentId: optionalId,
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: checkbox,
});

export const userSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  email: z.email("Enter a valid email address.").trim().max(160),
  role: z.enum(USER_ROLES),
  departmentId: optionalId,
  isActive: checkbox,
});

/**
 * Deliberately modest: a length floor plus a "not one of the obvious ones"
 * check. Composition rules push people toward predictable substitutions
 * without adding real entropy.
 */
const WEAK_PASSWORDS = new Set([
  "password",
  "password1",
  "12345678",
  "qwertyui",
  "changeme",
  "letmein1",
  "admin123",
]);

export const passwordField = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200, "That password is too long.")
  .refine((value) => !WEAK_PASSWORDS.has(value.toLowerCase()), {
    message: "That password is too easy to guess.",
  });

export const createUserSchema = userSchema.extend({
  password: passwordField,
  mustChangePassword: checkbox,
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "The two passwords do not match.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "The two passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").max(160),
  password: z.string().min(1, "Enter your password."),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  email: z.email("Enter a valid email address.").trim().max(160),
});

const isoDate = z
  .string()
  .trim()
  .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), {
    message: "Enter a valid date.",
  })
  .transform((value) => (value === "" ? null : new Date(value).toISOString()));

export const createRequestSchema = z.object({
  kind: z.enum(REQUEST_KINDS).optional(),
  citizenName: z.string().trim().min(2, "Enter the citizen's name.").max(120),
  phone,
  email: optionalEmail,
  categoryId: z.string().trim().min(1, "Choose a category."),
  departmentId: optionalId,
  assignedStaffId: optionalId,
  location: optionalText.pipe(z.string().max(200)),
  description: z.string().trim().min(5, "Describe the request in at least 5 characters.").max(4000),
  priority: z.enum(PRIORITIES).default("Normal"),
  status: z.enum(REQUEST_STATUSES).default("New"),
  source: z.enum(REQUEST_SOURCES).default("staff"),
  dueAt: isoDate.optional(),
});

export const updateRequestSchema = z.object({
  kind: z.enum(REQUEST_KINDS).optional(),
  citizenName: z.string().trim().min(2, "Enter the citizen's name.").max(120),
  phone,
  email: optionalEmail,
  categoryId: z.string().trim().min(1, "Choose a category."),
  departmentId: optionalId,
  assignedStaffId: optionalId,
  location: optionalText.pipe(z.string().max(200)),
  description: z.string().trim().min(5, "Describe the request in at least 5 characters.").max(4000),
  priority: z.enum(PRIORITIES),
  status: z.enum(REQUEST_STATUSES),
  dueAt: isoDate.optional(),
});

export const noteSchema = z.object({
  note: z.string().trim().min(2, "Write a note first.").max(2000),
});

export const settingsSchema = z.object({
  organisationName: z.string().trim().min(2).max(120),
  defaultRequestPriority: z.enum(PRIORITIES),
  autoRefreshSeconds: z.coerce.number().int().min(0).max(300),
  notifyCitizenOnCreate: checkbox,
  notifyCitizenOnStatusChange: checkbox,
  notifyStaffOnUrgent: checkbox,
});

export const apiKeySchema = z.object({
  label: z.string().trim().min(2, "Give the key a recognisable name.").max(80),
});

/** The payload external callers POST to /api/requests. */
export const externalRequestSchema = z.object({
  citizenName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().default(""),
  email: z.string().trim().max(160).optional().default(""),
  category: z.string().trim().min(1),
  kind: z.enum(REQUEST_KINDS).optional(),
  location: z.string().trim().max(200).optional().default(""),
  description: z.string().trim().min(5).max(4000),
  priority: z.enum(PRIORITIES).optional().default("Normal"),
  source: z.enum(REQUEST_SOURCES).optional(),
  attachedImage: z.string().trim().max(500).optional(),
});
