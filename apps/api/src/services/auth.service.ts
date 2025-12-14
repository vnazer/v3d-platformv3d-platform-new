import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    organizationId: string;
}

export interface Tokens {
    accessToken: string;
    refreshToken: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

/**
 * Compare password with hashed password
 */
export async function comparePassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate JWT access and refresh tokens
 */
export function generateTokens(payload: TokenPayload): Tokens {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(
        { ...payload, type: 'refresh' },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload & { type?: string };

        // Remove type if it exists (for refresh tokens)
        const { type, ...payload } = decoded as any;

        return payload as TokenPayload;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Token expired');
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid token');
        }
        throw new Error('Token verification failed');
    }
}

/**
 * Generate random verification token
 */
export function generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
}

/**
 * Generate password reset token with expiry
 */
export function generatePasswordResetToken(): {
    token: string;
    expires: Date;
} {
    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiry

    return { token, expires };
}
