import { NextRequest, NextResponse } from "next/server";
import { verifyLicenseSchema } from "@/lib/validations";
import { verifyLicense } from "@/services/license-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validated = verifyLicenseSchema.parse(body);

    // Verify license
    const license = await verifyLicense(validated.licenseKey, validated.projectId);

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        license: {
          licenseKey: license.licenseKey,
          type: license.type,
          expiresAt: license.expiresAt,
          activationCount: license.activationCount,
          maxActivations: license.maxActivations,
        },
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          data: { valid: false },
          error: error.message,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, data: { valid: false }, error: "Internal server error" },
      { status: 500 }
    );
  }
}
