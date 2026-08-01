import { NextRequest, NextResponse } from "next/server";
import { activateLicenseSchema } from "@/lib/validations";
import { activateLicense } from "@/services/license-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = activateLicenseSchema.parse(body);

    // Get client IP and user agent
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Activate license
    const result = await activateLicense(
      validated.licenseKey,
      validated.licenseKey, // Using licenseKey as projectId - need to adjust
      {
        hwid: validated.hwid,
        deviceId: validated.deviceId,
        ipAddress,
        userAgent,
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        activated: true,
        hwid: result.hwid,
        deviceId: result.deviceId,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          data: { activated: false },
          error: error.message,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        data: { activated: false },
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
