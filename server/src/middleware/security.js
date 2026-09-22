import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import { logEvent } from '../utils/audit.js';

/**
 * Strips Mongo operators ($, keys containing dots) from user input to block
 * NoSQL injection. express-mongo-sanitize mutates req.body/query/params.
 */
export const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logEvent({
      req,
      level: 'security',
      action: 'nosql_injection_attempt',
      meta: { location: key },
    });
  },
});

const cleanString = (value) => xss(value, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script'] });

const walk = (value, key) => {
  if (Array.isArray(value)) return value.map((item) => walk(item, key));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v, k)]));
  }
  if (typeof value === 'string' && key !== 'password') return cleanString(value);
  return value;
};

/** Recursively sanitises strings against stored/reflected XSS. */
export const sanitizeXss = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') req.body = walk(req.body);
  if (req.query && typeof req.query === 'object') req.query = walk(req.query);
  next();
};

const ATTACK_PATTERNS = [
  { name: 'sql_injection', re: /(\bunion\b.*\bselect\b)|(\bor\b\s+1\s*=\s*1)|(--\s)|(\bdrop\b\s+\btable\b)|(;\s*--)/i },
  { name: 'path_traversal', re: /(\.\.\/)|(\.\.\\)|(%2e%2e%2f)|(%2e%2e\/)/i },
  { name: 'xss_probe', re: /(<script\b)|(javascript:\s*)|(onerror\s*=)|(<img[^>]+src\s*=)/i },
  { name: 'command_injection', re: /(\|\s*(cat|ls|whoami|curl|wget|nc)\b)|(;\s*(cat|rm|del)\b)|(\$\(.*\))|(`.*`)/i },
  { name: 'nosql_operator', re: /(\$ne\b)|(\$gt\b)|(\$where\b)|(\$regex\b)/i },
];

/**
 * Lightweight IDS: inspects the raw URL + body and records suspicious payloads
 * so the admin Security page can surface attempted attacks. It does not block
 * by itself (sanitisation + validation already neutralise the input).
 */
export const detectAttacks = (req, _res, next) => {
  const haystack = `${req.originalUrl} ${JSON.stringify(req.body || {})}`;
  for (const { name, re } of ATTACK_PATTERNS) {
    if (re.test(haystack)) {
      logEvent({
        req,
        level: 'security',
        action: `attack_${name}`,
        meta: { sample: haystack.slice(0, 500) },
      });
      break;
    }
  }
  next();
};
