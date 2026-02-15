import { IncomingHttpHeaders } from 'http';

/**
 * Header classification buckets following industry-standard categories
 * used by CDNs, WAFs, and SIEM systems for request auditing.
 */

const STANDARD_HEADERS = new Set([
    'host', 'accept', 'accept-charset', 'accept-encoding', 'accept-language',
    'cache-control', 'connection', 'content-length', 'content-type',
    'date', 'expect', 'if-match', 'if-modified-since', 'if-none-match',
    'if-unmodified-since', 'origin', 'pragma', 'range', 'referer',
    'te', 'transfer-encoding', 'upgrade', 'via', 'dnt',
    'upgrade-insecure-requests', 'sec-fetch-dest', 'sec-fetch-mode',
    'sec-fetch-site', 'sec-fetch-user',
]);

const SECURITY_HEADERS = new Set([
    'authorization', 'proxy-authorization',
    'cookie', 'set-cookie',
    'x-csrf-token', 'x-xsrf-token',
]);

const PROXY_HEADERS = new Set([
    'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto',
    'x-forwarded-port', 'x-real-ip', 'forwarded',
    'cf-connecting-ip', 'cf-ray', 'cf-ipcountry',
    'x-amzn-trace-id', 'x-request-id',
    'true-client-ip',
]);

export interface ClassifiedHeaders {
    standard: Record<string, string | string[] | undefined>;
    security: Record<string, string>;
    proxy: Record<string, string | string[] | undefined>;
    custom: Record<string, string | string[] | undefined>;
}

/**
 * Classifies incoming HTTP headers into standard, security, proxy, and custom buckets.
 * Sensitive headers (authorization, cookies) are automatically redacted.
 */
export function classifyHeaders(headers: IncomingHttpHeaders): ClassifiedHeaders {
    const result: ClassifiedHeaders = {
        standard: {},
        security: {},
        proxy: {},
        custom: {},
    };

    for (const [key, value] of Object.entries(headers)) {
        const lowerKey = key.toLowerCase();

        if (SECURITY_HEADERS.has(lowerKey)) {
            result.security[lowerKey] = '[REDACTED]';
        } else if (PROXY_HEADERS.has(lowerKey)) {
            result.proxy[lowerKey] = value;
        } else if (STANDARD_HEADERS.has(lowerKey)) {
            result.standard[lowerKey] = value;
        } else {
            result.custom[lowerKey] = value;
        }
    }

    return result;
}
