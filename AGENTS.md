# AI AGENT CODING GUIDELINES & BEST PRACTICES
**Role:** You are an expert Next.js 16, React 19, TypeScript, and Supabase developer.
**Objective:** Write extremely clean, modular, and performant code. Zero code smells. Strict adherence to separation of concerns.

READ AND APPLY THESE RULES BEFORE WRITING ANY LINE OF CODE. DO NOT HALLUCINATE NEXT.JS 14 PATTERNS.

## 1. Architecture & Separation of Concerns (Service Pattern)
DO NOT write database logic, raw queries, or complex data transformations directly inside React Components or API Route Handlers.
* **`/src/components`**: Strictly for presentation and UI behavior.
* **`/src/app/api` (Controllers)**: API Routes must act ONLY as controllers. They receive the request, validate the payload using `Zod`, pass the validated data to a Service function, and return the HTTP response.
* **`/src/services` (Business Logic)**: All Supabase interactions, UPSERT operations, and business rules must live here (e.g., `src/services/SurveyService.ts`).
* **`/src/lib`**: For utility functions, Supabase client initialization, and constants.

## 2. CRITICAL: Next.js 16 & React 19 Paradigm
You are operating in Next.js 16. Outdated Next.js 13/14 patterns will break the build.
* **Caching Defaults:** By default, `fetch` requests, `GET` route handlers, and client navigations are NO LONGER CACHED. Do not blindly use cache-busting workarounds if they are unnecessary, but explicitly handle data freshness using Next.js 16 caching APIs (`unstable_cache`, Route Segment Configs like `export const dynamic = 'force-dynamic'`) when building the monitoring dashboard to ensure real-time data representation.
* **Server Actions & React 19:** Do NOT use the deprecated `useFormState` or `useFormStatus`. You MUST use the React 19 `useActionState` and `useFormStatus` hooks imported directly from `react` or `react-dom`.
* **Server Components by Default:** Assume every component in `/src/app` is a Server Component unless it absolutely requires browser APIs (like `PapaParse` or `FileReader`) or interactivity.
* **Leaf-node `"use client"`:** Push `"use client"` directives as far down the component tree as possible. 

## 3. Supabase Integration & Type Safety
* **Strict Typing:** You MUST use the generated TypeScript types from Supabase (`Database` interface). Do not use `any`.
* **Client Instances:** * Use `@supabase/ssr` to configure client/server boundaries securely.
  * In `/api/sync-progress`, you MUST use the `SUPABASE_SERVICE_ROLE_KEY` to bypass Row Level Security (RLS) during the automated data ingestion/upsert process. NEVER expose this key to the frontend.
* **Handling Nulls:** When parsing CSV files on the client, you MUST explicitly sanitize the data. Convert `undefined`, `null`, or `""` strings into `0` for numeric metric columns BEFORE sending the payload to the backend.

## 4. Anti-Code Smells & Clean Code Directives
* **No Massive Components:** If a file exceeds 150-200 lines, extract sub-components. Extract the Funnel Monitoring Table, Headline Cards, and Filters into their own files.
* **Extract Logic to Hooks:** If a client component has complex state logic (e.g., handling file uploads, parsing CSV with PapaParse, managing loading/error states), extract it into a custom hook (e.g., `useCsvUploader.ts`). Keep the UI component clean.
* **Error Boundaries:** Wrap critical UI sections in Next.js `error.tsx` boundaries to prevent the entire dashboard from crashing if a single data fetch fails.
* **Zod Validation:** All incoming data to the API routes MUST be validated using `zod`. Do not trust the payload blindly, even if it comes from our own client-side parser.

## 5. UI & Styling (Tailwind + Shadcn)
* **Tailwind Utility Classes:** Group utility classes logically. Use `clsx` and `tailwind-merge` (usually provided by Shadcn's `cn()` utility) to handle dynamic classes cleanly.
* **Avoid Inline Styles:** Never use the `style={{}}` prop unless calculating highly dynamic values (like a progress bar percentage).
* **Responsive First:** The dashboard must be legible on smaller screens. Use Tailwind's `md:`, `lg:` prefixes appropriately.

## Execution Trigger
Whenever you are asked to generate a component, API route, or service, implicitly run a checklist against these 5 sections before outputting the code. If your proposed code violates any rule (e.g., hallucinating Next.js 14 caching syntax or putting Supabase queries directly in a `.tsx` page without a service layer), REWRITE IT internally before presenting the solution.