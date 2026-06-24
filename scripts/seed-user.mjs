import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // Requires dotenv to be installed if running directly, but we can just pass env directly or load .env.local manually

import fs from 'fs';
import path from 'path';

// Parse .env.local manually to avoid needing `dotenv`
const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
envFile.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1];
    const value = match[2];
    process.env[key] = value.replace(/^"(.*)"$/, '$1'); // basic unquoting
  }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedUser() {
  const email = "3603gardase2026@gmail.com";
  const password = "Tangerang3603";

  console.log(`Seeding user: ${email}...`);

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // auto-confirm email
  });

  if (error) {
    if (error.message.includes("already registered") || error.message.includes("already exists")) {
      console.log(`User ${email} is already registered.`);
      return;
    }
    console.error("Error creating user:", error.message);
    process.exit(1);
  }

  console.log("Successfully created user:", data.user?.email);
}

seedUser();
