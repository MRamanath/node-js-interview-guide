// CSRF protection examples

/*
 * INTERVIEW QUESTIONS & ANSWERS
 *
 * Q1: What is CSRF and how does it work?
 * A: Cross-Site Request Forgery. Attacker tricks logged-in user into submitting unwanted request.
 *    Example: User visits evil.com which submits form to bank.com using user's cookies.
 *
 * Q2: How do CSRF tokens protect against attacks?
 * A: Token is generated per session/request and validated on submission.
 *    Attacker can't read the token due to Same-Origin Policy.
 *
 * Q3: Where should you store CSRF tokens?
 * A: Double-submit: cookie + header/body
 *    Synchronizer: session (server) + hidden form field
 *    Never in localStorage (XSS vulnerable)
 *
 * Q4: Does HTTPS prevent CSRF?
 * A: No. CSRF exploits authenticated sessions, not the transport layer.
 *
 * Q5: What's the difference between CSRF and XSS?
 * A: CSRF: Tricks user into unwanted action (uses credentials)
 *    XSS: Injects malicious scripts (steals credentials)
 *
 * Q6: Do you need CSRF protection for APIs?
 * A: If using cookies: YES
 *    If using Authorization header (JWT): NO (can't auto-send cross-origin)
 *
 * Q7: What's SameSite cookie's role in CSRF prevention?
 * A: SameSite=Strict/Lax prevents cookies from being sent cross-origin.
 *    Good defense layer but tokens provide better protection.
 *
 * Q8: How do you handle CSRF in SPAs?
 * A: Fetch token on page load, include in header for all mutations.
 *    Or use Authorization header with JWT (no CSRF risk).
 *
 * Q9: What HTTP methods should be CSRF protected?
 * A: All state-changing: POST, PUT, DELETE, PATCH
 *    GET should never change state (safe methods).
 */
const express = require('express');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Use cookie-based CSRF tokens
const csrfProtection = csurf({
	cookie: {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production'
	}
});

// Provide token to client
app.get('/csrf-token', csrfProtection, (req, res) => {
	res.json({ csrfToken: req.csrfToken() });
});

// Protect state-changing routes
app.post('/transfer', csrfProtection, (req, res) => {
	res.json({ status: 'transfer initiated' });
});

// Example usage:
// 1) GET /csrf-token -> token
// 2) POST /transfer with header: "x-csrf-token: <token>"
