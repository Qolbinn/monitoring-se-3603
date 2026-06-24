"use client";

import React, { useActionState } from "react";
import { loginAction } from "@/app/actions/authActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormStatus } from "react-dom";
import { AlertCircle, Lock, Mail } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full h-10 inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Memproses..." : "Masuk"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, null);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
            Garda SE 3603
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitoring Progress Sensus Ekonomi
          </p>
        </div>

        <Card className="rounded-[16px] shadow-lg border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center font-bold">Login Admin</CardTitle>
            <CardDescription className="text-center">
              Silakan masuk untuk mengakses fitur upload data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              {state?.error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="nama@email.com"
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <SubmitButton />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
