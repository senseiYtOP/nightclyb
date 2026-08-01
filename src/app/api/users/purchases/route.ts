import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/services/user-service";
import { getUserPurchaseHistory } from "@/services/dashboard-service";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await verifySession(sessionToken);
    const purchases = await getUserPurchaseHistory(user.id);

    return NextResponse.json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
