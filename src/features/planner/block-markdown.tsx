'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type BlockMarkdownProps = {
  content: string;
};

export function BlockMarkdown({ content }: BlockMarkdownProps) {
  return (
    <div className="text-fg text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h3 className="text-fg mt-3 mb-1.5 text-base font-semibold">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="text-fg mt-3 mb-1.5 text-sm font-semibold">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-fg mt-3 mb-1 text-sm font-semibold">{children}</h4>
          ),
          p: ({ children }) => <p className="text-fg my-1.5 leading-relaxed">{children}</p>,
          ul: ({ children }) => (
            <ul className="text-fg my-1.5 ml-5 list-disc space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="text-fg my-1.5 ml-5 list-decimal space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="text-fg font-semibold">{children}</strong>,
          em: ({ children }) => <em className="text-fg italic">{children}</em>,
          code: ({ children }) => (
            <code className="bg-bg text-fg rounded px-1.5 py-0.5 font-mono text-xs">
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
