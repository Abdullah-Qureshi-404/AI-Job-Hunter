/**
 * Renders a scraped job description as readable, structured content.
 *
 * Scrapers return plain text where the structure lives entirely in line
 * breaks, bullet characters and heading lines. Rendering that inside a <p>
 * collapsed all whitespace into one unreadable block. This parses the text
 * back into headings, bullet lists and paragraphs.
 *
 * Nothing is invented or reworded - only the original text is displayed.
 */

const BULLET_PATTERN = /^\s*(?:[-•*·▪◦‣]|\(?\d{1,2}[.)])\s+/;

/**
 * Strip markdown emphasis markers. Job boards embed **bold** and _italics_ in
 * their plain-text descriptions; rendered literally they look like leftover
 * AI output.
 */
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

// "REQUIREMENTS", "What you'll do:", "Responsibilities" etc.
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

  // A whole line wrapped in ** ** is nearly always a section title.
  if (/^\s*\*\*[^*]+\*\*\s*:?\s*$/.test(line)) return true;

  // Ends with a colon and is short: almost always a section label.
  if (trimmed.endsWith(':') && trimmed.length <= 60) return true;

  const letters = trimmed.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 3 && letters === letters.toUpperCase()) return true;

  const lower = trimmed.toLowerCase();
  return (
    trimmed.length <= 45 &&
    HEADING_WORDS.some((word) => lower.startsWith(word))
  );
}

/** Group raw lines into blocks we can render. */
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
  if (!text || !String(text).trim()) {
    return <p className="jobdetail-description-text">{emptyMessage}</p>;
  }

  const blocks = parseBlocks(String(text));

  return (
    <div className="jobdetail-description">
      {blocks.map((block, index) => {
        if (block.type === 'h') {
          return (
            <h3
              key={index}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#e8e8f0',
                margin: index === 0 ? '0 0 8px' : '20px 0 8px',
                letterSpacing: 0.2,
              }}
            >
              {block.text}
            </h3>
          );
        }

        if (block.type === 'ul') {
          return (
            <ul
              key={index}
              style={{
                margin: '0 0 14px',
                paddingLeft: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {block.items.map((item, i) => (
                <li
                  key={i}
                  style={{ fontSize: 13, color: '#9090a8', lineHeight: 1.6 }}
                >
                  {item}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={index}
            style={{
              fontSize: 13,
              color: '#9090a8',
              lineHeight: 1.7,
              margin: '0 0 14px',
            }}
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
