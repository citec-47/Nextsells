'use client';

import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { errorResponse, successResponse } from '@/lib/utils/api';

const prisma = new PrismaClient();

/**
 * POST /api/seller/onboarding
 * Submit seller onboarding form with documents
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = extractToken(request.headers.get('authorization'));
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return errorResponse('Invalid token', 401);
    }

    // Parse form data
    const formData = await request.formData();

    // Extract fields
    const companyName = formData.get('companyName') as string;
    const businessType = formData.get('businessType') as string;
    const businessAddress = formData.get('businessAddress') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const zipCode = formData.get('zipCode') as string;
    const country = formData.get('country') as string;
    const taxId = formData.get('taxId') as string;
    const website = formData.get('website') as string;
    const bio = formData.get('bio') as string;

    // Validate required fields
    if (!companyName || !businessAddress || !city || !state || !zipCode) {
      return errorResponse('Missing required fields', 400);
    }

    // Get files
    const logoFile = formData.get('logo') as File | null;
    const nationalIdFile = formData.get('nationalId') as File | null;
    const businessLicenseFile = formData.get('businessLicense') as File | null;

    if (!nationalIdFile || !businessLicenseFile) {
      return errorResponse('Identity documents are required', 400);
    }

    // TODO: Upload files to cloud storage (S3, Cloudinary, etc.)
    // const logoUrl = logoFile ? await uploadFile(logoFile, 'logos') : null;
    // const nationalIdUrl = await uploadFile(nationalIdFile, 'documents');
    // const businessLicenseUrl = await uploadFile(businessLicenseFile, 'documents');

    // For now, use placeholder URLs
    const logoUrl = logoFile ? `/uploads/logos/${logoFile.name}` : null;
    const nationalIdUrl = `/uploads/documents/${nationalIdFile.name}`;
    const businessLicenseUrl = `/uploads/documents/${businessLicenseFile.name}`;

    // Update seller profile
    const updatedProfile = await prisma.sellerProfile.update({
      where: { userId: payload.userId },
      data: {
        companyName,
        businessType,
        businessAddress,
        city,
        state,
        zipCode,
        country,
        taxId: taxId || null,
        website: website || null,
        bio: bio || null,
        logo: logoUrl,
        status: 'PENDING_REVIEW',
      },
    });

    // Create document records
    await prisma.sellerDocument.create({
      data: {
        sellerId: updatedProfile.id,
        documentType: 'NATIONAL_ID',
        documentNumber: 'ID-' + Date.now(),
        documentUrl: nationalIdUrl,
        status: 'PENDING',
      },
    });

    await prisma.sellerDocument.create({
      data: {
        sellerId: updatedProfile.id,
        documentType: 'BUSINESS_LICENSE',
        documentNumber: 'BL-' + Date.now(),
        documentUrl: businessLicenseUrl,
        status: 'PENDING',
      },
    });

    // Create approval request
    await prisma.approvalRequest.create({
      data: {
        sellerId: updatedProfile.id,
        status: 'PENDING',
      },
    });

    return successResponse(
      {
        message: 'Onboarding application submitted successfully',
        status: 'PENDING_REVIEW',
      },
      'Application submitted',
      201
    );
  } catch (error) {
    console.error('Onboarding error:', error);
    return errorResponse('Internal server error', 500);
  }
}
