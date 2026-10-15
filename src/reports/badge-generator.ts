import { LetterGrade } from '../core/evaluation/scoring.js';

export interface BadgeOptions {
  score?: number;
  grade?: LetterGrade;
  label?: string;
}

export class BadgeGenerator {
  static generate(options: BadgeOptions = {}): string {
    const label = options.label || 'OWASP LLM';
    const grade = options.grade || 'A';
    const score = options.score !== undefined ? `${options.score}%` : '';
    const statusText = score ? `Grade ${grade} (${score})` : `Grade ${grade}`;

    const color =
      grade === 'A' ? '#10b981' :
      grade === 'B' ? '#3b82f6' :
      grade === 'C' ? '#f59e0b' :
      grade === 'D' ? '#f97316' :
      '#ef4444';

    const labelWidth = Math.round(label.length * 7.5 + 16);
    const statusWidth = Math.round(statusText.length * 7.2 + 16);
    const totalWidth = labelWidth + statusWidth;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${statusText}">
  <title>${label}: ${statusText}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#1e293b"/>
    <rect x="${labelWidth}" width="${statusWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text aria-hidden="true" x="${labelWidth + statusWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${statusText}</text>
    <text x="${labelWidth + statusWidth / 2}" y="14">${statusText}</text>
  </g>
</svg>`;
  }
}
