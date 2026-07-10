import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPageMeta, toRange, type PaginationInput } from "@/lib/pagination.js";
import { mapSupabaseError } from "@/lib/supabase-errors.js";
import type { BookListQuery } from "@/modules/books/books.schema.js";

const LIST_SELECT = `
  *,
  publisher:publishers(id, name),
  language:languages(id, code, name),
  category:categories(id, name),
  subject:subjects(id, name),
  book_copies(count)
`;

const DETAIL_SELECT = `
  *,
  publisher:publishers(id, name, city, country),
  language:languages(id, code, name),
  category:categories(id, name),
  subject:subjects(id, name),
  book_authors(author_role, sort_order, author:authors(id, full_name, original_name)),
  book_keywords(keyword:keywords(id, name)),
  book_images(id, storage_path, is_primary, sort_order),
  book_files(id, file_type, file_name, file_size_bytes, mime_type, is_downloadable, created_at),
  book_copies(id, inventory_number, barcode, status, price, acquisition_date, acquisition_type,
    rack:racks(id, name, shelf:shelves(id, name, location:locations(id, name))))
`;

async function findBookIdsByCopyIdentifier(
  client: SupabaseClient,
  field: "barcode" | "inventory_number",
  value: string
): Promise<string[]> {
  const { data, error } = await client.from("book_copies").select("book_id").ilike(field, `%${value}%`);
  if (error) throw mapSupabaseError(error);
  return [...new Set((data ?? []).map((row) => row.book_id as string))];
}

async function findBookIdsByAuthorName(client: SupabaseClient, name: string): Promise<string[]> {
  const { data: authorRows, error: authorError } = await client
    .from("authors")
    .select("id")
    .ilike("full_name", `%${name}%`);
  if (authorError) throw mapSupabaseError(authorError);

  const authorIds = (authorRows ?? []).map((a) => a.id as string);
  if (authorIds.length === 0) return [];

  const { data, error } = await client.from("book_authors").select("book_id").in("author_id", authorIds);
  if (error) throw mapSupabaseError(error);
  return [...new Set((data ?? []).map((row) => row.book_id as string))];
}

async function findBookIdsByKeyword(client: SupabaseClient, keyword: string): Promise<string[]> {
  const { data: keywordRows, error: keywordError } = await client
    .from("keywords")
    .select("id")
    .ilike("name", `%${keyword}%`);
  if (keywordError) throw mapSupabaseError(keywordError);

  const keywordIds = (keywordRows ?? []).map((k) => k.id as string);
  if (keywordIds.length === 0) return [];

  const { data, error } = await client.from("book_keywords").select("book_id").in("keyword_id", keywordIds);
  if (error) throw mapSupabaseError(error);
  return [...new Set((data ?? []).map((row) => row.book_id as string))];
}

export const booksRepository = {
  async list(client: SupabaseClient, pagination: PaginationInput, filters: BookListQuery) {
    let query = client.from("books").select(LIST_SELECT, { count: "exact" });

    if (filters.q) query = query.or(`title.ilike.%${filters.q}%,original_title.ilike.%${filters.q}%,annotation.ilike.%${filters.q}%`);
    if (filters.isbn) query = query.ilike("isbn", `%${filters.isbn}%`);
    if (filters.udk) query = query.ilike("udk", `%${filters.udk}%`);
    if (filters.bbk) query = query.ilike("bbk", `%${filters.bbk}%`);
    if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
    if (filters.subjectId) query = query.eq("subject_id", filters.subjectId);
    if (filters.languageId) query = query.eq("language_id", filters.languageId);
    if (filters.grade) query = query.lte("min_grade", filters.grade).gte("max_grade", filters.grade);
    if (filters.publisherId) query = query.eq("publisher_id", filters.publisherId);
    if (filters.year) query = query.eq("publication_year", filters.year);
    if (filters.hasElectronicCopy !== undefined) query = query.eq("has_electronic_copy", filters.hasElectronicCopy);

    if (filters.author) {
      const ids = await findBookIdsByAuthorName(client, filters.author);
      if (ids.length === 0) return { data: [], meta: buildPageMeta(pagination, 0) };
      query = query.in("id", ids);
    }
    if (filters.keyword) {
      const ids = await findBookIdsByKeyword(client, filters.keyword);
      if (ids.length === 0) return { data: [], meta: buildPageMeta(pagination, 0) };
      query = query.in("id", ids);
    }
    if (filters.barcode) {
      const ids = await findBookIdsByCopyIdentifier(client, "barcode", filters.barcode);
      if (ids.length === 0) return { data: [], meta: buildPageMeta(pagination, 0) };
      query = query.in("id", ids);
    }
    if (filters.inventoryNumber) {
      const ids = await findBookIdsByCopyIdentifier(client, "inventory_number", filters.inventoryNumber);
      if (ids.length === 0) return { data: [], meta: buildPageMeta(pagination, 0) };
      query = query.in("id", ids);
    }

    const [from, to] = toRange(pagination);
    const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);

    if (error) throw mapSupabaseError(error);
    return { data: data ?? [], meta: buildPageMeta(pagination, count ?? 0) };
  },

  async get(client: SupabaseClient, id: string) {
    const { data, error } = await client.from("books").select(DETAIL_SELECT).eq("id", id).single();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async insertScalar(client: SupabaseClient, row: Record<string, unknown>, createdBy: string) {
    const { data, error } = await client
      .from("books")
      .insert({ ...row, created_by: createdBy })
      .select()
      .single();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async updateScalar(client: SupabaseClient, id: string, row: Record<string, unknown>) {
    const { data, error } = await client.from("books").update(row).eq("id", id).select().single();
    if (error) throw mapSupabaseError(error);
    return data;
  },

  async remove(client: SupabaseClient, id: string) {
    const { error } = await client.from("books").delete().eq("id", id);
    if (error) throw mapSupabaseError(error);
  },

  async replaceAuthors(client: SupabaseClient, bookId: string, authorIds: string[]) {
    const { error: deleteError } = await client.from("book_authors").delete().eq("book_id", bookId);
    if (deleteError) throw mapSupabaseError(deleteError);
    if (authorIds.length === 0) return;

    const rows = authorIds.map((authorId, index) => ({
      book_id: bookId,
      author_id: authorId,
      sort_order: index,
    }));
    const { error } = await client.from("book_authors").insert(rows);
    if (error) throw mapSupabaseError(error);
  },

  async replaceKeywords(client: SupabaseClient, bookId: string, keywordNames: string[]) {
    const { error: deleteError } = await client.from("book_keywords").delete().eq("book_id", bookId);
    if (deleteError) throw mapSupabaseError(deleteError);
    if (keywordNames.length === 0) return;

    const keywordIds: string[] = [];
    for (const name of keywordNames) {
      const { data: existing, error: findError } = await client
        .from("keywords")
        .select("id")
        .eq("name", name)
        .maybeSingle();
      if (findError) throw mapSupabaseError(findError);

      if (existing) {
        keywordIds.push(existing.id as string);
        continue;
      }

      const { data: created, error: createError } = await client
        .from("keywords")
        .insert({ name })
        .select("id")
        .single();
      if (createError) throw mapSupabaseError(createError);
      keywordIds.push(created.id as string);
    }

    const rows = keywordIds.map((keywordId) => ({ book_id: bookId, keyword_id: keywordId }));
    const { error } = await client.from("book_keywords").insert(rows);
    if (error) throw mapSupabaseError(error);
  },
};
