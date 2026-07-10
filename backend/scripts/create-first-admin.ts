/**
 * One-time bootstrap: creates the first Director account so someone can log
 * in and use the staff-only /auth/register endpoint for everyone after.
 *
 * Usage:
 *   pnpm bootstrap:admin -- --email you@library.org --password 'Str0ng!Pass' --name "Your Name"
 */
import { parseArgs } from "node:util";
import { generateBarcode } from "@/lib/barcode.js";
import { supabaseAdmin } from "@/lib/supabase.js";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    password: { type: "string" },
    name: { type: "string" },
  },
});

if (!values.email || !values.password || !values.name) {
  console.error("Usage: pnpm bootstrap:admin -- --email <email> --password <password> --name <full name>");
  process.exit(1);
}

const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
  email: values.email,
  password: values.password,
  email_confirm: true,
  user_metadata: { full_name: values.name },
});

if (createError || !created.user) {
  console.error("Failed to create auth identity:", createError?.message);
  process.exit(1);
}

const { error: profileError } = await supabaseAdmin.from("users").upsert({
  id: created.user.id,
  full_name: values.name,
  email: values.email,
  role: "director",
  reader_category: "staff",
  library_card_barcode: generateBarcode("RD"),
});

if (profileError) {
  console.error("Failed to create profile row:", profileError.message);
  await supabaseAdmin.auth.admin.deleteUser(created.user.id);
  process.exit(1);
}

console.log(`Director account created: ${values.email}`);
