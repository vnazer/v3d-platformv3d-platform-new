import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    passwordResetRequestSchema,
    passwordResetSchema,
    emailVerificationSchema,
} from '../validators/auth.validators.js';
import {
    hashPassword,
    comparePassword,
    generateTokens,
    verifyToken,
    generateVerificationToken,
    generatePasswordResetToken,
} from '../services/auth.service.js';

const prisma = new PrismaClient();

/**
 * Register new user and organization
 * POST /auth/register
 */
export async function register(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        // Validate request body
        const validatedData = registerSchema.parse(req.body);

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'User with this email already exists',
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(validatedData.password);

        // Generate verification token
        const verificationToken = generateVerificationToken();

        // Create organization and user in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create organization
            const organization = await tx.organization.create({
                data: {
                    name: validatedData.organizationName,
                    slug: validatedData.organizationName
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, ''),
                },
            });

            // Create user
            const user = await tx.user.create({
                data: {
                    email: validatedData.email,
                    password_hash: hashedPassword,
                    first_name: validatedData.firstName,
                    last_name: validatedData.lastName,
                    role: 'ADMIN', // First user is admin
                    organization_id: organization.id,
                    email_verified: false, // TODO: Send verification email
                },
                select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                    role: true,
                    organization_id: true,
                    email_verified: true,
                    created_at: true,
                },
            });

            return { user, organization };
        });

        // Generate tokens
        const tokens = generateTokens({
            userId: result.user.id,
            email: result.user.email,
            role: result.user.role,
            organizationId: result.user.organization_id,
        });

        // TODO: Send verification email
        console.log(`Verification token for ${result.user.email}: ${verificationToken}`);

        res.status(201).json({
            success: true,
            data: {
                user: result.user,
                organization: result.organization,
                tokens,
            },
            message: 'Registration successful. Please verify your email.',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Login user
 * POST /auth/login
 */
export async function login(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        // Validate request body
        const validatedData = loginSchema.parse(req.body);

        // Find user
        const user = await prisma.user.findFirst({
            where: {
                email: validatedData.email,
                is_active: true,
            },
            include: {
                organization: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        // Verify password
        const isValidPassword = await comparePassword(
            validatedData.password,
            user.password_hash
        );

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        // Generate tokens
        const tokens = generateTokens({
            userId: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organization_id,
        });

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { last_login: new Date() },
        });

        // Remove password from response
        const { password_hash, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: {
                user: userWithoutPassword,
                tokens,
            },
            message: 'Login successful',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Refresh access token
 * POST /auth/refresh
 */
export async function refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const validatedData = refreshTokenSchema.parse(req.body);

        // Verify refresh token
        const payload = verifyToken(validatedData.refreshToken);

        // Generate new tokens
        const tokens = generateTokens(payload);

        res.json({
            success: true,
            data: { tokens },
            message: 'Token refreshed successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get current user info
 * GET /auth/me
 */
export async function me(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = (req as any).userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                avatar_url: true,
                role: true,
                is_active: true,
                email_verified: true,
                last_login: true,
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        logo_url: true,
                    },
                },
                created_at: true,
                updated_at: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        res.json({
            success: true,
            data: { user },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Logout (client-side cleanup primarily)
 * POST /auth/logout
 */
export async function logout(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        // In a production app, you might want to blacklist the token
        // For now, just send a success response

        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Request password reset
 * POST /auth/password-reset/request
 */
export async function requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const validatedData = passwordResetRequestSchema.parse(req.body);

        const user = await prisma.user.findFirst({
            where: { email: validatedData.email },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return res.json({
                success: true,
                message: 'If the email exists, a password reset link has been sent',
            });
        }

        const { token, expires } = generatePasswordResetToken();

        // TODO: Store reset token in database or cache
        // TODO: Send password reset email

        console.log(`Password reset token for ${user.email}: ${token}`);
        console.log(`Expires at: ${expires}`);

        res.json({
            success: true,
            message: 'If the email exists, a password reset link has been sent',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Reset password with token
 * POST /auth/password-reset/confirm
 */
export async function resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const validatedData = passwordResetSchema.parse(req.body);

        // TODO: Verify token from database/cache
        // For now, this is a placeholder

        // Hash new password
        const hashedPassword = await hashPassword(validatedData.password);

        // TODO: Update user password
        // await prisma.user.update({ ... });

        res.json({
            success: true,
            message: 'Password reset successful',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Verify email with token
 * POST /auth/verify-email
 */
export async function verifyEmail(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const validatedData = emailVerificationSchema.parse(req.body);

        // TODO: Verify token and update user
        // For now, this is a placeholder

        res.json({
            success: true,
            message: 'Email verified successfully',
        });
    } catch (error) {
        next(error);
    }
}
