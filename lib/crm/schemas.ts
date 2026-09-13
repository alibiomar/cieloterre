import { z } from "zod";

const uuid = z.string().uuid();
const shortText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const operationTableSchema = z.enum([
  "transactions",
  "financial_entries",
  "crm_templates",
  "crm_messages",
  "crm_articles",
  "inquiries",
]);

export const operationRecordSchemas = {
  transactions: z.object({
    agency_id: uuid.nullable().optional(),
    agent_id: uuid.nullable().optional(),
    property_id: uuid.nullable().optional(),
    contact_id: uuid.nullable().optional(),
    transaction_type: z.enum(["sale", "rent", "management"]),
    stage: shortText(40).default("prospect"),
    amount: z.coerce.number().finite().min(0).max(1_000_000_000),
    commission_rate: z.coerce.number().finite().min(0).max(100).optional(),
    commission_amount: z.coerce.number().finite().min(0).max(1_000_000_000).optional(),
    currency: z.string().trim().length(3).toUpperCase().default("TND"),
    expected_close_date: optionalText(30),
    notes: optionalText(4000),
  }),
  financial_entries: z.object({
    transaction_id: uuid.nullable().optional(),
    agency_id: uuid.nullable().optional(),
    entry_type: z.enum(["income", "expense", "commission", "payment", "refund"]),
    category: shortText(80),
    description: shortText(4000),
    amount: z.coerce.number().finite().min(0).max(1_000_000_000),
    currency: z.string().trim().length(3).toUpperCase().default("TND"),
    status: z.enum(["pending", "paid", "cancelled"]).default("pending"),
    due_date: optionalText(30),
  }),
  crm_templates: z.object({
    name: shortText(160),
    category: z.enum(["email", "contract", "notice"]),
    subject: optionalText(240),
    body: shortText(100_000),
    variables: z.array(z.string().trim().max(80)).max(50).default([]),
  }),
  crm_messages: z.object({
    template_id: uuid.nullable().optional(),
    contact_id: uuid.nullable().optional(),
    transaction_id: uuid.nullable().optional(),
    recipient_email: z.string().trim().email().max(320),
    subject: shortText(240),
    body: shortText(100_000),
    status: z.enum(["draft", "queued", "sent", "failed"]).default("draft"),
  }),
  crm_articles: z.object({
    slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    category: shortText(100).default("Immobilier"),
    title: shortText(240),
    excerpt: shortText(1000),
    body: z.string().trim().max(200_000).default(""),
    image_url: z.string().trim().url().max(2048).nullable().optional(),
    read_time: shortText(40).default("5 min"),
    published: z.coerce.boolean().default(false),
    published_at: z.string().datetime().nullable().optional(),
  }),
  inquiries: z.object({
    name: shortText(120),
    email: z.string().trim().email().max(320),
    phone: optionalText(40),
    message: shortText(4000),
    property_id: uuid.nullable().optional(),
    user_id: uuid.nullable().optional(),
  }),
} as const;

export function parseOperationRecord(table: keyof typeof operationRecordSchemas, record: unknown) {
  return operationRecordSchemas[table].parse(record);
}
