import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { meditationHistory, conversationHistory, meditationAnalytics, usersTable } from "~/server/db/schema";
import { desc, eq } from "drizzle-orm";
import { createClient } from "~/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user from local database
    const localUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, user.email || ''))
      .limit(1);

    if (localUser.length === 0) {
      return NextResponse.json({ error: "User not found in local database" });
    }

    const userId = localUser[0]!.id;

    // Get recent meditation sessions
    const recentMeditations = await db
      .select()
      .from(meditationHistory)
      .where(eq(meditationHistory.user_id, userId))
      .orderBy(desc(meditationHistory.created_at))
      .limit(5);

    // Get recent conversations
    const recentConversations = await db
      .select()
      .from(conversationHistory)
      .where(eq(conversationHistory.user_id, userId))
      .orderBy(desc(conversationHistory.created_at))
      .limit(5);

    // Get analytics
    const analytics = await db
      .select()
      .from(meditationAnalytics)
      .limit(5);

    return NextResponse.json({
      success: true,
      user: {
        email: user.email,
        localId: userId,
      },
      data: {
        meditations: recentMeditations,
        conversations: recentConversations,
        analytics: analytics,
      },
      message: recentMeditations.length > 0 
        ? `✅ Found ${recentMeditations.length} meditation sessions!` 
        : "❌ No meditation sessions found - saving might not be working"
    });

  } catch (error) {
    console.error("Database test error:", error);
    return NextResponse.json({
      error: "Database test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
