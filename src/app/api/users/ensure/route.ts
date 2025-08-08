export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createAdminClient } from "~/utils/supabase/admin";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const schema = z.object({ email: z.string().email() });
    const parse = schema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parse.error.flatten() },
        { status: 400 },
      );
    }
    const { email } = parse.data;

    let supabase;
    try {
      supabase = createAdminClient();
    } catch (e: any) {
      return NextResponse.json(
        { error: "Admin client init failed", details: e?.message },
        { status: 500 },
      );
    }

    try {
      const { error } = await supabase
        .from("users_table")
        .upsert(
          {
            email,
            memory_L0: "",
            memory_L1: "",
            memory_L2: "",
            questionnaire: {},
          },
          { onConflict: "email" },
        );

      if (error) {
        return NextResponse.json(
          { error: "Upsert failed", details: error.message },
          { status: 500 },
        );
      }
    } catch (e: any) {
      return NextResponse.json(
        { error: "Database error", details: e?.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unexpected error", details: err?.message },
      { status: 500 },
    );
  }
}


