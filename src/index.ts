import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

import { classifyHeaders } from './utils/headerClassifier';
import { parseUserAgent } from './utils/userAgentParser';
import { extractGeoInfo } from './utils/geoExtractor';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

// Enable trust proxy for accurate IP resolution behind reverse proxies / load balancers
app.set('trust proxy', true);

/**
 * Builds a production-grade, categorized audit object from an incoming request.
 */
function buildRequestAudit(req: Request) {
    const now = new Date();

    // ── Meta ──────────────────────────────────────────────────────────────
    const meta = {
        timestamp: now.toISOString(),
        unixTimestamp: now.getTime(),
        requestId: (req.headers['x-request-id'] as string) ?? uuidv4(),
        serverHostname: os.hostname(),
        nodeVersion: process.version,
        processId: process.pid,
        uptime: Math.round(process.uptime()),
    };

    // ── Client ────────────────────────────────────────────────────────────
    const client = {
        ip: req.ip ?? req.socket.remoteAddress ?? 'unknown',
        ips: req.ips.length > 0 ? req.ips : undefined,
        port: req.socket.remotePort ?? null,
        forwardedFor: (req.headers['x-forwarded-for'] as string) ?? null,
        forwardedProto: (req.headers['x-forwarded-proto'] as string) ?? null,
        realIp: (req.headers['x-real-ip'] as string) ?? null,
    };

    // ── Request ───────────────────────────────────────────────────────────
    const request = {
        method: req.method,
        url: req.originalUrl,
        path: req.path,
        queryParams: req.query,
        httpVersion: req.httpVersion,
        protocol: req.protocol,
        secure: req.secure,
        hostname: req.hostname,
        contentLength: req.headers['content-length']
            ? parseInt(req.headers['content-length'], 10)
            : null,
        contentType: req.headers['content-type'] ?? null,
    };

    // ── User Agent ────────────────────────────────────────────────────────
    const userAgent = parseUserAgent(req.headers['user-agent']);

    // ── Headers (classified & redacted) ───────────────────────────────────
    const headers = classifyHeaders(req.headers);

    // ── TLS ───────────────────────────────────────────────────────────────
    const tlsSocket = (req.socket as any);
    const tls = {
        encrypted: !!tlsSocket.encrypted,
        protocol: tlsSocket.getProtocol?.() ?? null,
        cipher: tlsSocket.getCipher?.()?.name ?? null,
        authorized: tlsSocket.authorized ?? null,
    };

    // ── Geo (from CDN/proxy headers) ──────────────────────────────────────
    const geo = extractGeoInfo(req.headers);

    return {
        meta,
        client,
        request,
        userAgent,
        headers,
        tls,
        geo,
    };
}

// ── Routes ──────────────────────────────────────────────────────────────────
app.get('/', (req: Request, res: Response) => {
    const audit = buildRequestAudit(req);

    // Log prettified audit to console
    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('  📥  Incoming Request Audit');
    console.log('══════════════════════════════════════════════════════════════');
    console.log(JSON.stringify(audit, null, 2));
    console.log('══════════════════════════════════════════════════════════════\n');

    res.status(200).json(audit);
});

// ── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 Request Info Parser API`);
    console.log(`   Listening on http://localhost:${PORT}`);
    console.log(`   Node ${process.version} | PID ${process.pid} | Host ${os.hostname()}\n`);
});
