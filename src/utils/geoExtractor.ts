import { IncomingHttpHeaders } from 'http';

/**
 * Extracts geo-location data from common CDN/proxy headers.
 * Supported: Cloudflare, AWS CloudFront, Akamai, Fastly, Vercel.
 */

export interface GeoInfo {
    country: string | null;
    region: string | null;
    city: string | null;
    latitude: string | null;
    longitude: string | null;
    timezone: string | null;
    source: string | null;
}

const HEADER_MAP: { source: string; country: string; region?: string; city?: string; lat?: string; lon?: string; tz?: string }[] = [
    {
        source: 'cloudflare',
        country: 'cf-ipcountry',
        city: 'cf-ipcity',
        lat: 'cf-iplatitude',
        lon: 'cf-iplongitude',
        tz: 'cf-timezone',
        region: 'cf-ipregion',
    },
    {
        source: 'aws-cloudfront',
        country: 'cloudfront-viewer-country',
        region: 'cloudfront-viewer-country-region',
        city: 'cloudfront-viewer-city',
        lat: 'cloudfront-viewer-latitude',
        lon: 'cloudfront-viewer-longitude',
        tz: 'cloudfront-viewer-time-zone',
    },
    {
        source: 'vercel',
        country: 'x-vercel-ip-country',
        region: 'x-vercel-ip-country-region',
        city: 'x-vercel-ip-city',
        lat: 'x-vercel-ip-latitude',
        lon: 'x-vercel-ip-longitude',
        tz: 'x-vercel-ip-timezone',
    },
    {
        source: 'akamai',
        country: 'x-akamai-edgescape', // contains semi-colon delimited key=value pairs
    },
    {
        source: 'fastly',
        country: 'x-geo-country',
        city: 'x-geo-city',
    },
];

function getHeader(headers: IncomingHttpHeaders, key: string): string | null {
    const val = headers[key.toLowerCase()];
    if (typeof val === 'string' && val.length > 0) return val;
    return null;
}

export function extractGeoInfo(headers: IncomingHttpHeaders): GeoInfo {
    for (const mapping of HEADER_MAP) {
        const country = getHeader(headers, mapping.country);
        if (!country) continue;

        return {
            country,
            region: mapping.region ? getHeader(headers, mapping.region) : null,
            city: mapping.city ? getHeader(headers, mapping.city) : null,
            latitude: mapping.lat ? getHeader(headers, mapping.lat) : null,
            longitude: mapping.lon ? getHeader(headers, mapping.lon) : null,
            timezone: mapping.tz ? getHeader(headers, mapping.tz) : null,
            source: mapping.source,
        };
    }

    return {
        country: null,
        region: null,
        city: null,
        latitude: null,
        longitude: null,
        timezone: null,
        source: null,
    };
}
