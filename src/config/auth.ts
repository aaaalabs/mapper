/**
 * Authentication Configuration for Mapper
 * 
 * IMPORTANT: Mapper uses a simplified authentication approach:
 * 1. There is ONLY ONE authenticated user: admin@libralab.ai
 * 2. NO user roles or permissions are used - only email check
 * 3. All other users are treated as anonymous leads
 * 
 * DO NOT:
 * - Add user roles or permissions
 * - Create additional authenticated users
 * - Implement complex auth flows
 */

export const ADMIN_EMAIL = 'admin@libralab.ai' as const;

/**
 * Type guard to check if a user is the admin
 */
export const isAdminUser = (email: string | undefined | null): boolean => {
    return email === ADMIN_EMAIL;
};

/**
 * Constants for auth-related routes
 */
export const AUTH_ROUTES = {
    LOGIN: '/login',
    ADMIN: '/admin',
    PUBLIC: '/'
} as const;

/**
 * Error messages for authentication
 */
export const AUTH_ERRORS = {
    INVALID_CREDENTIALS: 'Invalid credentials. Only admin@libralab.ai can log in.',
    UNAUTHORIZED: 'Unauthorized. This section is only accessible by admin@libralab.ai',
    GENERAL_ERROR: 'Authentication error occurred. Please try again.'
} as const;
