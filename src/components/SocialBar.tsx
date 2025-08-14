// SocialBar.tsx
'use client';

type Props = {
  handles?: string[]; // can be @handles OR full https URLs
  position?: 'floating' | 'footer';
};

function toUrl(s: string) {
  const t = s.trim();
  if (/^https?:\/\//i.test(t)) return t;               // already a URL
  const handle = t.replace(/^@/, '');
  return `https://instagram.com/${handle}`;
}

function toLabel(s: string) {
  const t = s.trim();
  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t);
      // take first non-empty path segment as handle
      const seg = u.pathname.split('/').filter(Boolean)[0] || 'instagram';
      return '@' + seg;
    } catch {
      return '@instagram';
    }
  }
  return t.startsWith('@') ? t : '@' + t;
}

export default function SocialBar({ handles, position = 'floating' }: Props) {
  const envHandles =
    (process.env.NEXT_PUBLIC_IG_HANDLES || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

  const list = (handles && handles.length ? handles : envHandles).length
    ? (handles || envHandles)
    : ['@yourbrand'];

  return (
    <div className={position === 'footer' ? 'socialbar socialbar--footer' : 'socialbar socialbar--fab'} aria-label="Social links">
      <div className="socialbar__inner instagram">
        <span className="socialbar__label" aria-hidden="true">Follow us</span>
        <ul className="socialbar__list">
          {list.map(s => (
            <li key={s}>
              <a
                href={toUrl(s)}
                target="_blank"
                rel="noopener noreferrer"
                className="socialbar__link instagram"
                aria-label={`Open Instagram profile ${toLabel(s)}`}
                title={toLabel(s)}
              >
                <InstagramIcon />
                <span className="socialbar__text">{toLabel(s)}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function InstagramIcon() {
  return (
    <svg className="socialbar__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6ZM18.5 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
    </svg>
  );
}
