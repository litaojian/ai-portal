export interface ParsedCurl {
    full_url: string;
    base_url: string;
    endpoint_url: string;
    endpoint_type: string;
    model_name: string;
    request_body: Record<string, any> | null;
    api_token: string;
}

/**
 * Parse a cURL command and extract LLM API request information.
 * Handles multi-line curl commands with backslash continuations.
 */
export function parseCurl(curlCommand: string): ParsedCurl {
    // Normalize: remove backslash-newlines and collapse whitespace
    const normalized = curlCommand
        .replace(/\\\r?\n/g, ' ')
        .replace(/\r?\n/g, ' ')
        .trim();

    const full_url = extractUrl(normalized);
    const { base_url, endpoint_url } = splitUrl(full_url);
    const headers = extractHeaders(normalized);
    const api_token = extractToken(headers);
    const request_body = extractBody(normalized);
    const model_name = typeof request_body?.model === 'string' ? request_body.model : '';
    const endpoint_type = detectEndpointType(endpoint_url);

    return {
        full_url,
        base_url,
        endpoint_url,
        endpoint_type,
        model_name,
        request_body,
        api_token,
    };
}

function extractUrl(normalized: string): string {
    // Match: curl [options] URL  or  curl URL [options]
    // Handles --location, -X METHOD, -s, --silent, etc. before or after URL
    // URL must start with http:// or https://
    const urlMatch = normalized.match(/https?:\/\/[^\s'"]+/);
    return urlMatch ? urlMatch[0] : '';
}

function splitUrl(fullUrl: string): { base_url: string; endpoint_url: string } {
    try {
        const parsed = new URL(fullUrl);
        const base_url = `${parsed.protocol}//${parsed.host}`;
        const endpoint_url = parsed.pathname || '/';
        return { base_url, endpoint_url };
    } catch {
        return { base_url: '', endpoint_url: '' };
    }
}

function extractHeaders(normalized: string): Record<string, string> {
    const headers: Record<string, string> = {};
    // Match -H "name: value" or --header "name: value" (single or double quotes)
    const pattern = /(?:-H|--header)\s+(['"])(.*?)\1/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(normalized)) !== null) {
        const colonIdx = match[2].indexOf(':');
        if (colonIdx !== -1) {
            const name = match[2].slice(0, colonIdx).trim().toLowerCase();
            const value = match[2].slice(colonIdx + 1).trim();
            headers[name] = value;
        }
    }
    return headers;
}

function extractToken(headers: Record<string, string>): string {
    const auth = headers['authorization'] ?? '';
    if (auth.toLowerCase().startsWith('bearer ')) {
        return auth.slice(7).trim();
    }
    return '';
}

function extractBody(normalized: string): Record<string, any> | null {
    const dataFlags = ['--data-binary', '--data-raw', '--data', '-d'];
    for (const flag of dataFlags) {
        const idx = normalized.indexOf(flag + ' ');
        if (idx === -1) continue;

        const rest = normalized.slice(idx + flag.length).trimStart();
        if (!rest) continue;

        const rawBody = extractQuotedString(rest);
        if (!rawBody) continue;

        try {
            return JSON.parse(rawBody);
        } catch {
            // Body is not valid JSON - return raw string wrapped
            return { _raw: rawBody };
        }
    }
    return null;
}

/**
 * Extract a quoted string (single or double quoted) from the start of the input.
 * Handles backslash escaping inside double-quoted strings.
 */
function extractQuotedString(input: string): string {
    if (!input) return '';
    const quote = input[0];
    if (quote !== "'" && quote !== '"') {
        // Unquoted: take until next space (edge case)
        const spaceIdx = input.indexOf(' ');
        return spaceIdx === -1 ? input : input.slice(0, spaceIdx);
    }

    let i = 1;
    while (i < input.length) {
        const ch = input[i];
        if (ch === '\\' && quote === '"') {
            i += 2; // skip escaped char
            continue;
        }
        if (ch === quote) {
            return input.slice(1, i);
        }
        i++;
    }
    // No closing quote found - return everything after opening quote
    return input.slice(1);
}

/**
 * Detect endpoint type from URL path.
 */
export function detectEndpointType(path: string): string {
    if (path.includes('/chat/completions')) return 'chat';
    if (path.includes('/images/')) return 'images';
    if (path.includes('/video/') || path.includes('/videos/')) return 'videos';
    if (path.includes('/audio/')) return 'audio';
    if (path.includes('/embeddings')) return 'embeddings';
    if (path.includes('/completions')) return 'completions';
    return 'chat';
}
