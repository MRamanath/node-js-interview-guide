// Authentication vs Authorization examples
// Authentication = who you are
// Authorization = what you can do

/*
 * INTERVIEW QUESTIONS & ANSWERS
 *
 * Q1: What's the difference between authentication and authorization?
 * A: Authentication verifies WHO you are (identity). Authorization verifies WHAT you can do (permissions).
 *    Example: Login proves your identity (auth). Admin role grants delete permissions (authz).
 *
 * Q2: Can you have authorization without authentication?
 * A: No. You must first identify the user (authentication) before checking their permissions (authorization).
 *
 * Q3: What HTTP status codes are used?
 * A: 401 Unauthorized = authentication failed (no/invalid token)
 *    403 Forbidden = authorization failed (authenticated but no permission)
 *
 * Q4: How do you implement role-based authorization?
 * A: Store user roles in JWT/session, create middleware that checks req.user.role against allowed roles.
 *
 * Q5: What's the difference between RBAC and ABAC?
 * A: RBAC (Role-Based) = permissions by role (admin, user)
 *    ABAC (Attribute-Based) = permissions by attributes (department, location, time)
 *
 * Q6: How do you handle multiple roles per user?
 * A: Store roles as array in JWT: { roles: ['user', 'moderator'] }
 *    Check with: roles.some(r => allowedRoles.includes(r))
 *
 * Q7: Should authorization logic be in middleware or business logic?
 * A: Both. Middleware for route-level protection. Business logic for fine-grained checks.
 *    Example: Middleware checks if user is admin. Business logic checks if user owns the resource.
 *
 * Q8: How do you implement resource-based authorization?
 * A: Check if user owns/can access specific resource:
 *    if (resource.userId !== req.user.id && req.user.role !== 'admin') return 403
 */

const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// --- Authentication middleware ---
function authenticate(req, res, next) {
	const authHeader = req.headers.authorization;
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) return res.status(401).json({ error: 'No token provided' });

	try {
		req.user = jwt.verify(token, JWT_SECRET);
		return next();
	} catch (err) {
		return res.status(401).json({ error: 'Invalid token' });
	}
}

// --- Authorization middleware ---
function authorize(...roles) {
	return (req, res, next) => {
		if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
		if (!roles.includes(req.user.role)) {
			return res.status(403).json({ error: 'Not authorized' });
		}
		return next();
	};
}

// Mock login: issues a token (authentication)
app.post('/login', (req, res) => {
	const { email } = req.body;
	// In real apps: validate password and load user from DB
	const user = { id: '123', email, role: 'user' };
	const token = jwt.sign(user, JWT_SECRET, { expiresIn: '15m' });
	res.json({ token });
});

// Authenticated route (only identity required)
app.get('/me', authenticate, (req, res) => {
	res.json({ user: req.user });
});

// Authorized route (must be admin)
app.delete('/users/:id', authenticate, authorize('admin'), (req, res) => {
	res.json({ message: `User ${req.params.id} deleted` });
});

// Example usage:
// 1) POST /login -> token
// 2) GET /me with Authorization: Bearer <token>
// 3) DELETE /users/123 requires role=admin
