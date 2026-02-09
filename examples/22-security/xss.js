// XSS prevention examples

/*
 * INTERVIEW QUESTIONS & ANSWERS
 *
 * Q1: What is XSS (Cross-Site Scripting)?
 * A: Injecting malicious scripts into web pages viewed by other users.
 *    Attacker steals cookies, session tokens, or performs actions as victim.
 *
 * Q2: What are the types of XSS?
 * A: Stored (Persistent): Malicious script saved in DB, shown to all users
 *    Reflected: Script in URL, executed immediately
 *    DOM-based: Client-side script manipulation, no server involvement
 *
 * Q3: How do you prevent XSS?
 * A: 1. Escape output: HTML encode user data before rendering
 *    2. Sanitize input: Remove/encode dangerous characters
 *    3. Content Security Policy (CSP): Restrict script sources
 *    4. httpOnly cookies: Prevent JS access to tokens
 *
 * Q4: What's the difference between escaping and sanitizing?
 * A: Escaping: Convert < to &lt; for display (preserves content)
 *    Sanitizing: Remove dangerous tags/attributes (strips content)
 *    Use escaping for output, sanitizing for rich text input.
 *
 * Q5: What is Content Security Policy (CSP)?
 * A: HTTP header that controls resource loading.
 *    Example: script-src 'self' → only same-origin scripts allowed
 *    Prevents inline scripts and eval() by default.
 *
 * Q6: How does CSP prevent XSS?
 * A: Blocks inline scripts, eval(), and untrusted external scripts.
 *    Even if attacker injects script, browser won't execute it.
 *    Requires nonce or hash for inline scripts.
 *
 * Q7: What's the difference between httpOnly and secure cookies?
 * A: httpOnly: Prevents JavaScript access (XSS protection)
 *    Secure: Only sent over HTTPS (MITM protection)
 *    Use both for session cookies.
 *
 * Q8: Should you validate input or escape output?
 * A: Both. Validate input for business logic (allowlist).
 *    Always escape output (defense in depth).
 *    Never trust input, even from database.
 *
 * Q9: How do you handle rich text (HTML) from users?
 * A: Use allowlist-based sanitizer (DOMPurify, xss library).
 *    Allow specific safe tags (<b>, <i>, <a>).
 *    Remove event handlers, javascript: URLs, dangerous attributes.
 *
 * Q10: What's the difference between XSS and CSRF?
 * A: XSS: Inject malicious code, runs in victim's browser, steals data
 *    CSRF: Trick user into unwanted actions, exploits trust in user
 *    XSS is more dangerous (can do anything user can do).
 */
const express = require('express');
const helmet = require('helmet');
const xss = require('xss');

const app = express();
app.use(express.json());

// Content Security Policy (CSP)
app.use(helmet({
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			scriptSrc: ["'self'"],
			objectSrc: ["'none'"]
		}
	}
}));

// Sanitize user input before rendering
app.post('/comment', (req, res) => {
	const { comment } = req.body;
	const safeComment = xss(comment);
	res.json({ stored: safeComment });
});

// Example usage:
// POST /comment { "comment": "<img src=x onerror=alert(1)>" }
