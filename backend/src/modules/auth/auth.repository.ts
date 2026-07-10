import type { SupabaseClient } from "@supabase/supabase-js";
import { generateBarcode } from "@/lib/barcode.js";
import { supabaseAdmin } from "@/lib/supabase.js";
import type { UserProfile } from "@/types/domain.js";
import type { RegisterUserInput } from "@/modules/auth/auth.schema.js";

const MAX_BARCODE_ATTEMPTS = 5;

async function createAuthIdentity(email: string, password: string, fullName: string) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    throw new Error(error?.message ?? "Failed to create auth identity");
  }

  return data.user;
}

async function insertProfile(userId: string, input: RegisterUserInput): Promise<UserProfile> {
  for (let attempt = 0; attempt < MAX_BARCODE_ATTEMPTS; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert({
        id: userId,
        full_name: input.fullName,
        email: input.email,
        phone: input.phone ?? null,
        pinfl: input.pinfl ?? null,
        class_id: input.classId ?? null,
        reader_category: input.readerCategory,
        role: input.role,
        photo_url: input.photoUrl ?? null,
        library_card_barcode: generateBarcode("RD"),
      })
      .select()
      .single();

    if (!error) {
      return data as UserProfile;
    }

    // 23505 = unique_violation; only retry when it's the barcode collision.
    if (error.code !== "23505" || !error.message.includes("library_card_barcode")) {
      throw new Error(error.message);
    }
  }

  throw new Error("Could not allocate a unique library card barcode, please retry");
}

export const authRepository = {
  async registerUser(input: RegisterUserInput): Promise<UserProfile> {
    const identity = await createAuthIdentity(input.email, input.password, input.fullName);

    try {
      return await insertProfile(identity.id, input);
    } catch (err) {
      // Compensate: don't leave an orphaned auth identity with no profile.
      await supabaseAdmin.auth.admin.deleteUser(identity.id);
      throw err;
    }
  },

  async getProfile(client: SupabaseClient, userId: string): Promise<UserProfile | null> {
    const { data, error } = await client.from("users").select("*").eq("id", userId).maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data as UserProfile | null;
  },
};
