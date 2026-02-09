// Rate limiting examples

/*
 * INTERVIEW QUESTIONS & ANSWERS
 *
 * Q1: Why is rate limiting important?
 * A: Prevents abuse, DDoS attacks, brute force, resource exhaustion.
 *    Protects API from excessive usage and ensures fair access.
 *
 * Q2: What's the difference between fixed window and sliding window?
 * A: Fixed window: Resets at fixed intervals (e.g., every minute)
 *    Can allow 2x limit at boundary (59s + 1s)
 *    Sliding window: Tracks requests over rolling time period, more accurate but complex
 *
 * Q3: How do you implement distributed rate limiting?
 * A: Use centralized store like Redis with atomic operations.
 *    Store counter with TTL per IP/user key.
 *    Pattern: INCR key, EXPIRE if new, check count
 *
 * Q4: What HTTP status code for rate limiting?
 * A: 429 Too Many Requests
 *    Include Retry-After header with seconds to wait
 *
 * Q5: How do you rate limit by user vs IP?
 * A: By IP: Anonymous users, use req.ip
 *    By user: Authenticated users, use user ID from token
 *    Best: Combine both with different limits
 *
 * Q6: What's token bucket algorithm?
 * A: Bucket holds tokens, refilled at constant rate.
 *    Request consumes token. If empty, reject.
 *    Allows bursts while limiting average rate.
 *
 * Q7: Should you rate limit health checks?
 * A: No. Exclude monitoring endpoints from rate limits.
 *    Or use separate, higher limit.
 *
 * Q8: How do you handle rate limit in microservices?
 * A: API gateway enforces global limits.
 *    Individual services can have additional limits.
 *    Use distributed cache (Redis) for consistency.
 *
 * Q9: What's the difference between throttling and rate limiting?
 * A: Rate limiting: Hard cap, rejects excess requests (429)
 *    Throttling: Delays requests to slow down client
 *    Both control request rate, different approaches
 *
 * Q10: How do you communicate rate limits to clients?
 * A: Response headers:
 *    X-RateLimit-Limit: max requests
 *    X-RateLimit-Remaining: requests left
 *    X-RateLimit-Reset: timestamp when resets
 */
const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();

// Global limiter
const globalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false
});

app.use(globalLimiter);

// Stricter limiter for auth routes
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5,
	message: 'Too many login attempts, try again later.'
});

app.post('/login', authLimiter, (req, res) => {
	res.json({ ok: true });
});

app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});
