/**
 * Auth0 TypeScript Types and Interfaces
 * Located at: lib/auth/auth0Types.ts
 * 
 * Provides type definitions for Auth0 integration
 */

import { Session } from '@auth0/nextjs-auth0';

/**
 * Extended Auth0 User with custom claims
 */
export interface Auth0User {
  sub: string; // Unique identifier (e.g., "auth0|...")
  email?: string;
  email_verified?: boolean;
  name?: string;
  nickname?: string;
  picture?: string;
  updated_at?: string;
  locale?: string;
  // Custom claims (if configured in Auth0)
  'https://aliexpress-clone/roles'?: string[];
  'https://aliexpress-clone/permissions'?: string[];
  // Add more custom claims as needed
  [key: string]: any;
}

/**
 * Auth0 Session Type
 */
export interface Auth0Session extends Session {
  user: Auth0User;
}

/**
 * User Hook State
 */
export interface UseAuth0UserState {
  user?: Auth0User;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: Error;
}

/**
 * Login/Logout Result
 */
export interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * API Protected Route Handler Options
 */
export interface ProtectedRouteOptions {
  returnTo?: string;
  onError?: (error: Error) => void;
}

/**
 * User Profile from Database (connected to Auth0)
 * Adjust fields based on your Prisma schema
 */
export interface UserProfile {
  id: string;
  auth0Id: string; // Maps to Auth0 user.sub
  email: string;
  name?: string;
  picture?: string;
  role: 'buyer' | 'seller' | 'admin';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Add your custom fields
}

/**
 * Seller Profile
 */
export interface SellerProfile extends UserProfile {
  role: 'seller';
  storeName: string;
  storeDescription?: string;
  storeImage?: string;
  isApproved: boolean;
  approvedAt?: Date;
  rating: number;
  reviews: number;
}

/**
 * Admin Profile
 */
export interface AdminProfile extends UserProfile {
  role: 'admin';
  permissions: string[];
}

/**
 * API Response Types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse extends ApiResponse {
  success: false;
  error: string;
}

export interface ApiSuccessResponse<T> extends ApiResponse<T> {
  success: true;
  data: T;
}

/**
 * Auth0 Config Type
 */
export interface Auth0ConfigType {
  domain?: string;
  clientId?: string;
  clientSecret?: string;
  baseURL?: string;
  secret?: string;
  issuerBaseURL?: string;
  routes: {
    callback: string;
    postLogoutRedirect: string;
  };
  session?: {
    rollingDuration?: number;
    absoluteDuration?: number;
  };
}

/**
 * Helper type for API routes
 */
export type ApiRouteHandler<T = any> = (
  request: Request
) => Promise<Response | ApiSuccessResponse<T> | ApiErrorResponse>;

/**
 * Guard for checking user role
 */
export type RoleGuard = 'buyer' | 'seller' | 'admin' | 'any';

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: Record<string, string>;
}
