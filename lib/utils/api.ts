import { NextResponse } from 'next/server';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Create success response
 */
export function successResponse<T>(
  data: T,
  message = 'Success',
  status = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

/**
 * Create error response
 */
export function errorResponse(
  error: string,
  status = 400,
  message = 'Error'
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message,
      error,
    },
    { status }
  );
}

/**
 * Create validation error response
 */
export function validationError(errors: Record<string, string[]>) {
  return NextResponse.json(
    {
      success: false,
      message: 'Validation error',
      errors,
    },
    { status: 422 }
  );
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
  fields: string[]
): Record<string, string[]> | null {
  const errors: Record<string, string[]> = {};

  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors[field] = [`${field} is required`];
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Safe JSON parse
 */
export function safeJsonParse(json: string, fallback: any = null) {
  try {
    return JSON.parse(json);
  } catch (error) {
    return fallback;
  }
}
