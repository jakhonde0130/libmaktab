import { z } from "zod";

// One Zod schema per lookup table. Each entry name matches the Supabase
// table name and the /reference/<name> route segment.
export const referenceSchemas = {
  languages: z.object({ code: z.string().min(1).max(10), name: z.string().min(1).max(100) }),
  publishers: z.object({
    name: z.string().min(1).max(200),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
  }),
  authors: z.object({
    fullName: z.string().min(1).max(200),
    originalName: z.string().max(200).optional(),
    birthYear: z.number().int().optional(),
    deathYear: z.number().int().optional(),
    bio: z.string().max(2000).optional(),
  }),
  subjects: z.object({ name: z.string().min(1).max(200) }),
  categories: z.object({ name: z.string().min(1).max(200), parentId: z.string().uuid().optional() }),
  keywords: z.object({ name: z.string().min(1).max(100) }),
  locations: z.object({
    name: z.string().min(1).max(200),
    code: z.string().max(30).optional(),
    description: z.string().max(500).optional(),
  }),
  shelves: z.object({
    locationId: z.string().uuid(),
    name: z.string().min(1).max(100),
    code: z.string().max(30).optional(),
  }),
  racks: z.object({
    shelfId: z.string().uuid(),
    name: z.string().min(1).max(100),
    code: z.string().max(30).optional(),
  }),
} as const;

export type ReferenceResource = keyof typeof referenceSchemas;

// camelCase request field -> snake_case DB column, per resource.
export const referenceColumnMap: Record<ReferenceResource, Record<string, string>> = {
  languages: {},
  publishers: {},
  authors: { fullName: "full_name", originalName: "original_name", birthYear: "birth_year", deathYear: "death_year" },
  subjects: {},
  categories: { parentId: "parent_id" },
  keywords: {},
  locations: {},
  shelves: { locationId: "location_id" },
  racks: { shelfId: "shelf_id" },
};

export function toDbPayload(resource: ReferenceResource, input: Record<string, unknown>) {
  const columnMap = referenceColumnMap[resource];
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [columnMap[key] ?? key, value])
  );
}

// Searchable "name-ish" column per resource, used for the `?search=` filter.
export const referenceSearchColumn: Record<ReferenceResource, string> = {
  languages: "name",
  publishers: "name",
  authors: "full_name",
  subjects: "name",
  categories: "name",
  keywords: "name",
  locations: "name",
  shelves: "name",
  racks: "name",
};
