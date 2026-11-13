import {
	deleteCookie,
	getCookie,
	setCookie,
} from "@tanstack/react-start/server";
import { type JWTPayload, jwtVerify, SignJWT } from "jose";
import type { UserRole } from "../models/User.ts";

export const AUTH_COOKIE_NAME = "access_token";
export const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

export interface AuthUser {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	collegeName: string;
}

export type AuthPayload = AuthUser & JWTPayload;

const JWT_SECRET_STRING =
	process.env.JWT_SECRET || "campusgigs-super-secret-jwt-key-2026";

function getJwtSecretKey(): Uint8Array {
	return new TextEncoder().encode(JWT_SECRET_STRING);
}

/**
 * Signs a JWT access token with 7 days expiration and HS256 algorithm.
 */
export async function signAccessToken(
	payload: AuthUser | JWTPayload | Record<string, unknown>,
): Promise<string> {
	return new SignJWT(payload as JWTPayload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(getJwtSecretKey());
}

/**
 * Verifies a JWT access token and returns the decoded payload, or null if invalid/expired.
 */
export async function verifyAccessToken<T = AuthUser>(
	token: string,
): Promise<T | null> {
	if (!token) {
		return null;
	}

	try {
		const { payload } = await jwtVerify(token, getJwtSecretKey(), {
			algorithms: ["HS256"],
		});
		return payload as unknown as T;
	} catch {
		return null;
	}
}

/**
 * Sets the httpOnly 'access_token' cookie with path '/', sameSite 'lax', maxAge 7 days, and secure in production.
 */
export function setAuthCookie(token: string): void {
	setCookie(AUTH_COOKIE_NAME, token, {
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		maxAge: SEVEN_DAYS_IN_SECONDS,
		secure: process.env.NODE_ENV === "production",
	});
}

/**
 * Clears the 'access_token' cookie using deleteCookie from @tanstack/react-start/server.
 */
export function clearAuthCookie(): void {
	deleteCookie(AUTH_COOKIE_NAME, {
		path: "/",
	});
}

/**
 * Reads the 'access_token' cookie value using getCookie from @tanstack/react-start/server.
 */
export function getAuthCookie(): string | undefined {
	return getCookie(AUTH_COOKIE_NAME);
}
