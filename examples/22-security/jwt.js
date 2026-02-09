// JWT examples

/*
 * INTERVIEW QUESTIONS & ANSWERS
 *
 * Q1: What is JWT structure?
 * A: Three parts separated by dots: header.payload.signature
 *    header: algorithm & token type
 *    payload: claims (user data)
 *    signature: HMAC(header + payload, secret)
 *
 * Q2: Are JWTs encrypted?
 * A: No, they're BASE64 encoded (not encrypted). Anyone can decode and read payload.
 *    Signature prevents tampering, not reading. Use JWE for encryption.
 *
 * Q3: Where should you store JWTs?
 * A: httpOnly cookies (best for browser apps)
 *    Memory for SPAs (lost on refresh, needs refresh token)
 *    Never localStorage (XSS vulnerable)
 *
 * Q4: What's the difference between symmetric and asymmetric JWT signing?
 * A: Symmetric (HS256): Same secret for sign/verify, faster
 *    Asymmetric (RS256): Private key signs, public key verifies, better for microservices
 *
 * Q5: How do you invalidate JWTs?
 * A: Tokens can't be invalidated directly (stateless).
 *    Solutions: Short expiry + refresh tokens, token blacklist (Redis), token versioning
 *
 * Q6: What claims should you include in JWT?
 * A: Standard: iss (issuer), sub (subject), exp (expiry), iat (issued at), aud (audience)
 *    Custom: user id, role, permissions
 *    Keep payload small (sent with every request)
 *
 * Q7: What's the recommended JWT expiration time?
 * A: Access token: 15 minutes
 *    Refresh token: 7 days
 *    Balance security vs user experience
 *
 * Q8: How do you handle JWT expiry on client?
 * A: Catch 401 errors, use refresh token to get new access token, retry original request.
 *    Or refresh proactively before expiry.
 *
 * Q9: What's the difference between Bearer token and JWT?
 * A: Bearer is the authentication scheme (Authorization: Bearer <token>).
 *    JWT is the token format. You can have Bearer tokens that aren't JWTs.
 *
 * Q10: Why validate iss and aud claims?
 * A: Prevents token reuse across services/applications.
 *    Ensures token was issued by your server and intended for your app.
 */
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Sign a token
app.post('/login', (req, res) => {
	const { email } = req.body;
	const user = { id: '123', email, role: 'user' };
	const token = jwt.sign(user, JWT_SECRET, {
		expiresIn: '15m',
		issuer: 'myapp',
		audience: 'myapp-users'
	});
	res.json({ token });
});

// Verify token middleware
function authenticate(req, res, next) {
	const authHeader = req.headers.authorization;
	const token = authHeader && authHeader.split(' ')[1];
	if (!token) return res.status(401).json({ error: 'Missing token' });

	try {
		req.user = jwt.verify(token, JWT_SECRET, {
			issuer: 'myapp',
			audience: 'myapp-users'
		});
		return next();
	} catch (err) {
		return res.status(401).json({ error: 'Invalid or expired token' });
	}
}

app.get('/me', authenticate, (req, res) => {
	res.json({ user: req.user });
});

// Example usage:
// Authorization: Bearer <token>
