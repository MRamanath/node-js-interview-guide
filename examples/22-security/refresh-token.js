// Refresh token examples (simple in-memory store)

/*
 * INTERVIEW QUESTIONS & ANSWERS
 *
 * Q1: Why use refresh tokens?
 * A: Short-lived access tokens limit exposure if compromised.
 *    Refresh tokens allow reissuing without re-authentication.
 *    Balance security (short access token) vs UX (no frequent logins).
 *
 * Q2: Where should refresh tokens be stored?
 * A: Server: Database or Redis (can revoke)
 *    Client: httpOnly cookie (secure, not accessible to JS)
 *    Never in localStorage (XSS vulnerable)
 *
 * Q3: What's refresh token rotation?
 * A: Issue new refresh token each time it's used, invalidate old one.
 *    Prevents replay attacks. If old token used, suspicious activity detected.
 *
 * Q4: How do you detect stolen refresh tokens?
 * A: With rotation: If invalidated token is used, both tokens are revoked.
 *    Track usage (IP, device). Alert on suspicious changes.
 *
 * Q5: Should refresh tokens have expiration?
 * A: Yes. Common: 7-30 days.
 *    Absolute expiration forces re-authentication eventually.
 *    Can extend on use (sliding expiration) for active users.
 *
 * Q6: What's the refresh token flow?
 * A: 1. Login → receive access + refresh token
 *    2. Use access token for API calls
 *    3. Access token expires → use refresh to get new access token
 *    4. Refresh token expires → full login required
 *
 * Q7: Can you have multiple refresh tokens per user?
 * A: Yes. One per device/session.
 *    Allows logging out specific devices.
 *    Store device info with token.
 *
 * Q8: How do you implement logout with refresh tokens?
 * A: Delete refresh token from database.
 *    Access token remains valid until expiry (keep it short).
 *    For immediate logout: Use token blacklist.
 *
 * Q9: What's the difference between opaque and JWT refresh tokens?
 * A: Opaque: Random string, requires DB lookup, easy revocation
 *    JWT: Self-contained, no DB lookup, harder revocation
 *    Recommendation: Use opaque for refresh tokens
 *
 * Q10: How do you handle refresh token in SPAs?
 * A: Store in httpOnly cookie with SameSite=Strict.
 *    Or use BFF (Backend-For-Frontend) pattern.
 *    Automatically sent with refresh requests.
 */
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'access-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

// In-memory refresh store (use DB/Redis in production)
const refreshStore = new Map();

app.post('/login', (req, res) => {
	const user = { id: '123', role: 'user' };

	const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: '15m' });
	const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

	refreshStore.set(refreshToken, user.id);

	res.json({ accessToken, refreshToken });
});

app.post('/refresh', (req, res) => {
	const { refreshToken } = req.body;
	if (!refreshToken || !refreshStore.has(refreshToken)) {
		return res.status(401).json({ error: 'Invalid refresh token' });
	}

	try {
		const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
		const accessToken = jwt.sign({ id: payload.id }, JWT_SECRET, { expiresIn: '15m' });
		return res.json({ accessToken });
	} catch (err) {
		return res.status(401).json({ error: 'Invalid refresh token' });
	}
});

app.post('/logout', (req, res) => {
	const { refreshToken } = req.body;
	refreshStore.delete(refreshToken);
	res.json({ message: 'Logged out' });
});
