import { NextRequest, NextResponse } from "next/server";
import { purchaseSchema } from "@/lib/validations";
import { createPurchase } from "@/services/purchase-service";
import { verifySession } from "@/services/user-service";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    // Validate input
    const validated = purchaseSchema.parse(body);

    // Create purchase
    const purchase = await createPurchase(user.id, validated.projectId, {
      amount: validated.amount.toString(),
      currency: validated.currency,
      paymentMethod: validated.paymentMethod,
      couponCode: validated.couponCode,
    });

    return NextResponse.json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
