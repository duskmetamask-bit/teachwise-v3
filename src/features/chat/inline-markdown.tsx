'use client';

import ReactMarkdown from 'react-markdown';

type InlineMarkdownProps = {
  content: string;
};

const BLOCK = [
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'img',
] as const;

/**
 * Inline-only markdown for user chat messages. Allows `**bold**`, `*italic*`,
 * `` `code` `` and `[text](url)` — block elements (headings, lists, code
 * blocks, tables, paragraphs) are unwrapped via `unwrapDisallowed` so pasted
 * rich content doesn't break the chat layout.
 */
export function InlineMarkdown({ content }: InlineMarkdownProps) {
  return (
    <div className="leading-relaxed">
      <ReactMarkdown
        disallowedElements={[...BLOCK]}
        unwrapDisallowed
        components={{
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-90"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-black/15 px-1 py-0.5 font-mono text-[0.85em]">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
