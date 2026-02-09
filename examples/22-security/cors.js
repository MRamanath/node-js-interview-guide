// CORS examples

/*
 * INTERVIEW QUESTIONS & ANSWERS
 *
 * Q1: What is CORS and why is it needed?
 * A: Cross-Origin Resource Sharing. Browsers block requests to different origins for security.
 *    CORS headers tell browser which origins are allowed.
 *
 * Q2: What triggers a CORS preflight request?
 * A: Non-simple requests trigger OPTIONS preflight:
 *    - Methods: PUT, DELETE, PATCH
 *    - Custom headers (Authorization, Content-Type: application/json)
 *    - Credentials included
 *
 * Q3: What's the difference between simple and preflighted requests?
 * A: Simple: GET/POST with simple headers, no preflight
 *    Preflighted: Browser sends OPTIONS first to check if allowed
 *
 * Q4: How do you enable CORS for multiple origins?
 * A: Check origin against allowlist and set Access-Control-Allow-Origin dynamically.
 *    Never use wildcard (*) with credentials: true.
 *
 * Q5: What does Access-Control-Allow-Credentials do?
 * A: Allows cookies/authorization headers in cross-origin requests.
 *    Requires specific origin (can't use wildcard).
 *
 * Q6: Why can't you use * with credentials?
 * A: Security risk. Would allow any site to make authenticated requests.
 *    Must specify exact origin when credentials: true.
 *
 * Q7: What's SameSite cookie attribute?
 * A: Controls when cookies are sent:
 *    - Strict: Only same-site requests
 *    - Lax: Same-site + top-level navigation (default)
 *    - None: All requests (requires Secure flag)
 *
 * Q8: How do you debug CORS issues?
 * A: Check browser console for CORS errors
 *    Verify Access-Control-Allow-Origin matches request origin
 *    Check preflight OPTIONS response
 *    Ensure credentials/headers are allowed
 */
const express = require('express');
const cors = require('cors');

const app = express();

// 1) Basic: allow a single origin
app.use(cors({
	origin: 'https://client.example.com',
	methods: ['GET', 'POST', 'PUT', 'DELETE'],
	credentials: true
}));

// 2) Dynamic allowlist
const allowlist = new Set([
	'https://client.example.com',
	'https://admin.example.com'
]);

app.use((req, res, next) => {
	const origin = req.headers.origin;
	if (origin && allowlist.has(origin)) {
		res.header('Access-Control-Allow-Origin', origin);
		res.header('Access-Control-Allow-Credentials', 'true');
	}
	res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

	if (req.method === 'OPTIONS') return res.sendStatus(204);
	return next();
});

app.get('/profile', (req, res) => {
	res.json({ ok: true });
});

// Example usage:
// fetch('https://api.example.com/profile', { credentials: 'include' })
