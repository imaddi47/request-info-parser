import UAParser from 'ua-parser-js';

const BOT_PATTERNS = /bot|crawler|spider|crawling|slurp|mediapartners|googlebot|bingbot|yandex|baidu|duckduck|facebookexternalhit|twitterbot|linkedinbot|semrush|ahref|mj12bot|dotbot/i;

export interface ParsedUserAgent {
    raw: string;
    browser: string | null;
    browserVersion: string | null;
    engine: string | null;
    os: string | null;
    osVersion: string | null;
    device: {
        type: string;
        vendor: string | null;
        model: string | null;
    };
    isBot: boolean;
}

/**
 * Parses a raw User-Agent string into structured, analytics-friendly fields.
 * Detects bots, extracts browser/OS/device info using ua-parser-js.
 */
export function parseUserAgent(raw: string | undefined): ParsedUserAgent {
    const uaString = raw ?? '';
    const parser = new UAParser(uaString);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const engine = parser.getEngine();
    const device = parser.getDevice();

    const browserName = browser.name
        ? `${browser.name}${browser.version ? ' ' + browser.version : ''}`
        : null;

    const osName = os.name
        ? `${os.name}${os.version ? ' ' + os.version : ''}`
        : null;

    return {
        raw: uaString,
        browser: browserName,
        browserVersion: browser.version ?? null,
        engine: engine.name ?? null,
        os: osName,
        osVersion: os.version ?? null,
        device: {
            type: device.type ?? 'desktop',
            vendor: device.vendor ?? null,
            model: device.model ?? null,
        },
        isBot: BOT_PATTERNS.test(uaString),
    };
}
