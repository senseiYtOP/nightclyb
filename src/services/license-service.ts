"use server";

import { db } from "@/db";
import { licenses, licenseActivations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateDeviceID, generateHWID } from "@/lib/utils";

export async function verifyLicense(licenseKey: string, projectId: string) {
  try {
    const [license] = await db
      .select()
      .from(licenses)
      .where(
        and(
          eq(licenses.licenseKey, licenseKey),
          eq(licenses.projectId, projectId)
        )
      )
      .limit(1);

    if (!license) throw new Error("Invalid license key");

    if (!license.isActive || license.isRevoked) {
      throw new Error("License is not active");
    }

    if (license.expiresAt && license.expiresAt < new Date()) {
      throw new Error("License has expired");
    }

    if (
      license.maxActivations &&
      license.activationCount >= license.maxActivations
    ) {
      throw new Error("Maximum activations exceeded");
    }

    return license;
  } catch (error) {
    throw error;
  }
}

export async function activateLicense(
  licenseKey: string,
  projectId: string,
  data: {
    hwid?: string;
    deviceId?: string;
    ipAddress: string;
    userAgent: string;
  }
) {
  try {
    const license = await verifyLicense(licenseKey, projectId);

    // Check device lock
    if (license.deviceLockType === "hwid" && license.lockedHwid) {
      if (data.hwid !== license.lockedHwid) {
        throw new Error("License is locked to a different hardware");
      }
    } else if (license.deviceLockType === "device_id" && license.lockedDeviceId) {
      if (data.deviceId !== license.lockedDeviceId) {
        throw new Error("License is locked to a different device");
      }
    }

    // Create activation record
    const hwid = data.hwid || generateHWID();
    const deviceId = data.deviceId || generateDeviceID();

    const [activation] = await db
      .insert(licenseActivations)
      .values({
        licenseId: license.id,
        hwid: license.deviceLockType === "hwid" ? hwid : undefined,
        deviceId: license.deviceLockType === "device_id" ? deviceId : undefined,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      })
      .returning();

    // Update license
    await db
      .update(licenses)
      .set({
        activationCount: license.activationCount + 1,
        lastUsedAt: new Date(),
        lockedHwid:
          license.deviceLockType === "hwid" && !license.lockedHwid ? hwid : undefined,
        lockedDeviceId:
          license.deviceLockType === "device_id" && !license.lockedDeviceId
            ? deviceId
            : undefined,
      })
      .where(eq(licenses.id, license.id));

    return {
      license,
      activation,
      hwid,
      deviceId,
    };
  } catch (error) {
    throw error;
  }
}

export async function deactivateLicense(activationId: string) {
  try {
    const [activation] = await db
      .select()
      .from(licenseActivations)
      .where(eq(licenseActivations.id, activationId))
      .limit(1);

    if (!activation) throw new Error("Activation not found");

    await db
      .update(licenseActivations)
      .set({
        deactivatedAt: new Date(),
      })
      .where(eq(licenseActivations.id, activationId));

    return activation;
  } catch (error) {
    throw error;
  }
}

export async function revokeLicense(licenseKey: string) {
  try {
    const [license] = await db
      .select()
      .from(licenses)
      .where(eq(licenses.licenseKey, licenseKey))
      .limit(1);

    if (!license) throw new Error("License not found");

    await db
      .update(licenses)
      .set({
        isRevoked: true,
        isActive: false,
      })
      .where(eq(licenses.id, license.id));

    return license;
  } catch (error) {
    throw error;
  }
}

export async function getUserLicenses(userId: string) {
  try {
    const results = await db
      .select()
      .from(licenses)
      .where(eq(licenses.userId, userId));

    return results;
  } catch (error) {
    throw error;
  }
}

export async function getLicenseActivations(licenseId: string) {
  try {
    const results = await db
      .select()
      .from(licenseActivations)
      .where(eq(licenseActivations.licenseId, licenseId));

    return results;
  } catch (error) {
    throw error;
  }
}

export async function transferLicense(
  licenseKey: string,
  newUserId: string
) {
  try {
    const [license] = await db
      .select()
      .from(licenses)
      .where(eq(licenses.licenseKey, licenseKey))
      .limit(1);

    if (!license) throw new Error("License not found");

    await db
      .update(licenses)
      .set({
        userId: newUserId,
        activationCount: 0,
        lockedHwid: null,
        lockedDeviceId: null,
      })
      .where(eq(licenses.id, license.id));

    return license;
  } catch (error) {
    throw error;
  }
}
