"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthService } from "@/services/AuthService";

const loginSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }),
});

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  const parsed = loginSchema.safeParse({ email, password });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0].message,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      error: "Email atau password salah.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function logoutAction() {
  await AuthService.logout();
  revalidatePath("/", "layout");
  redirect("/login");
}
