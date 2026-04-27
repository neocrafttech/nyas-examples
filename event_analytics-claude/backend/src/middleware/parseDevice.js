import { UAParser } from 'ua-parser-js';
import crypto from 'crypto';

export function parseDevice(request) {
  const ua = request.headers['user-agent'] || '';
  const parsed = UAParser(ua);

  const deviceType =
    parsed.device.type === 'mobile' ? 'mobile' :
    parsed.device.type === 'tablet' ? 'tablet' : 'desktop';

  const ip = request.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || request.ip
    || '';
  const ip_hash = ip ? crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16) : null;

  return {
    device_type: deviceType,
    browser: parsed.browser.name || null,
    os: parsed.os.name || null,
    ip_hash,
  };
}
