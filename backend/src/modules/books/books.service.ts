import type { SupabaseClient } from "@supabase/supabase-js";
import { booksRepository } from "@/modules/books/books.repository.js";
import { toBookRow, type BookInput } from "@/modules/books/books.schema.js";

export const booksService = {
  async createBook(client: SupabaseClient, input: BookInput, createdBy: string) {
    const book = await booksRepository.insertScalar(client, toBookRow(input), createdBy);
    await booksRepository.replaceAuthors(client, book.id as string, input.authorIds);
    await booksRepository.replaceKeywords(client, book.id as string, input.keywords);
    return booksRepository.get(client, book.id as string);
  },

  async updateBook(client: SupabaseClient, id: string, input: Partial<BookInput>) {
    const row = toBookRow(input);
    if (Object.keys(row).length > 0) {
      await booksRepository.updateScalar(client, id, row);
    }
    if (input.authorIds !== undefined) {
      await booksRepository.replaceAuthors(client, id, input.authorIds);
    }
    if (input.keywords !== undefined) {
      await booksRepository.replaceKeywords(client, id, input.keywords);
    }
    return booksRepository.get(client, id);
  },
};
