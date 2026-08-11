import { useState } from 'react';

const BULLET_PATTERN = /^\s*(?:[-•*·▪◦‣]|\(?\d{1,2}[.)])\s+/;

function stripMarkdown(value) {
  return String(value)
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|\s)\*(\S[^*]*?)\*(?=\s|$|[.,;:!?])/g, '$1$2')
    .replace(/(^|\s)__(.+?)__(?=\s|$|[.,;:!?])/g, '$1$2')
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
    .replace(/^\s*#{1,6}\s+/gm, '')
    .trim();
}

const HEADING_WORDS = [
  'requirement', 'responsibilit', 'qualification', 'about', 'benefit',
  'what you', 'who you are', 'skills', 'experience', 'we offer',
  'nice to have', 'must have', 'role', 'duties', 'perks', 'compensation',
  'education', 'preferred', 'minimum', 'your mission', 'the job',
];

function isHeading(line) {
  const trimmed = stripMarkdown(line);

  if (!trimmed || trimmed.length > 80) return false;
  if (BULLET_PATTERN.test(trimmed)) return false;

  if (/^\s*\*\*[^*]+\*\*\s*:?\s*$/.test(line)) return true;

  if (trimmed.endsWith(':') && trimmed.length <= 60) return true;

  const letters = trimmed.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 3 && letters === letters.toUpperCase()) return true;

  const lower = trimmed.toLowerCase();
  return (
    trimmed.length <= 45 &&
    HEADING_WORDS.some((word) => lower.startsWith(word))
  );
}

function parseBlocks(rawText) {
  const text = stripMarkdown(rawText);
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];
  let bullets = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'p', text: paragraph.join(' ').trim() });
      paragraph = [];
    }
  };

  const flushBullets = () => {
    if (bullets.length) {
      blocks.push({ type: 'ul', items: [...bullets] });
      bullets = [];
    }
  };

  const flushAll = () => {
    flushParagraph();
    flushBullets();
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushAll();
      return;
    }

    if (BULLET_PATTERN.test(trimmed)) {
      flushParagraph();
      bullets.push(trimmed.replace(BULLET_PATTERN, '').trim());
      return;
    }

    if (isHeading(trimmed)) {
      flushAll();
      blocks.push({ type: 'h', text: trimmed.replace(/:$/, '') });
      return;
    }

    flushBullets();
    paragraph.push(trimmed);
  });

  flushAll();

  return blocks;
}

export default function JobDescription({ text, emptyMessage = 'No description provided for this position.' }) {
  const [expanded, setExpanded] = useState(false);

  if (!text || !String(text).trim()) {
    return <p className="text-xs text-zinc-500">{emptyMessage}</p>;
  }

  const rawString = String(text);
  const wordCount = rawString.trim().split(/\s+/).length;
  const isLong = wordCount > 300;

  let textToRender = rawString;
  if (isLong && !expanded) {
    const words = rawString.trim().split(/\s+/).slice(0, 300);
    textToRender = words.join(' ') + '...';
  }

  const blocks = parseBlocks(textToRender);

  return (
    <div className="space-y-4">
      <div className="space-y-3 text-xs leading-relaxed text-zinc-300">
        {blocks.map((block, index) => {
          if (block.type === 'h') {
            return (
              <h3
                key={index}
                className="text-sm font-bold text-white tracking-tight pt-2 pb-1 border-b border-white/5"
              >
                {block.text}
              </h3>
            );
          }

          if (block.type === 'ul') {
            return (
              <ul key={index} className="list-disc list-inside space-y-1.5 text-zinc-300 pl-2">
                {block.items.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            );
          }

          return (
            <p key={index} className="leading-relaxed text-zinc-300">
              {block.text}
            </p>
          );
        })}
      </div>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors pt-2 focus:outline-none"
        >
          {expanded ? 'Show less ↑' : 'Show more ↓'}
        </button>
      )}
    </div>
  );
}
