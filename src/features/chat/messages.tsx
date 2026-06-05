'use client';

import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/lib/ai';

type MessagesProps = {
  messages: Message[];
  status: 'idle' | 'sending' | 'streaming' | 'error';
};

export function Messages({ messages, status }: MessagesProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <ol className="flex flex-col gap-6">
      {messages.map((message, index) => {
        const isUser = message.role === 'user';
        const isLast = index === messages.length - 1;
        const isStreamingPlaceholder =
          !isUser && isLast && status === 'streaming' && message.content === '';

        return (
          <li
            key={`${message.role}-${index}`}
            className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                isUser
                  ? 'bg-accent text-accent-fg'
                  : 'bg-surface-raised border-border-subtle border'
              }`}
            >
              {isUser ? <User className="h-4 w-4" /> : <Bot className="text-accent h-4 w-4" />}
            </div>
            <div
              className={`max-w-3xl min-w-0 flex-1 rounded-xl px-5 py-4 text-sm leading-relaxed ${
                isUser ? 'bg-accent text-accent-fg' : 'bg-surface-raised text-fg'
              }`}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : isStreamingPlaceholder ? (
                <span className="text-fg-subtle inline-flex items-center gap-1.5 italic">
                  Thinking
                  <span className="flex gap-1">
                    <span className="bg-fg-subtle h-1 w-1 animate-pulse rounded-full" />
                    <span className="bg-fg-subtle h-1 w-1 animate-pulse rounded-full [animation-delay:150ms]" />
                    <span className="bg-fg-subtle h-1 w-1 animate-pulse rounded-full [animation-delay:300ms]" />
                  </span>
                </span>
              ) : (
                <MarkdownContent content={message.content} />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-fg mt-4 mb-2 text-lg font-semibold">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-fg mt-4 mb-2 text-base font-semibold">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-fg mt-3 mb-1.5 text-sm font-semibold">{children}</h3>
          ),
          p: ({ children }) => <p className="text-fg my-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => (
            <ul className="text-fg my-2 ml-5 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="text-fg my-2 ml-5 list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="text-fg font-semibold">{children}</strong>,
          em: ({ children }) => <em className="text-fg italic">{children}</em>,
          code: ({ children }) => (
            <code className="bg-bg text-fg rounded px-1.5 py-0.5 font-mono text-xs">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-bg text-fg my-3 overflow-x-auto rounded-lg p-3 font-mono text-xs">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-border-subtle text-fg-muted my-3 border-l-2 pl-3 italic">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover underline underline-offset-2"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="border-border-subtle w-full border-collapse border text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-bg text-fg">{children}</thead>,
          th: ({ children }) => (
            <th className="border-border-subtle border px-2 py-1.5 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-border-subtle border px-2 py-1.5 align-top">{children}</td>
          ),
          hr: () => <hr className="border-border-subtle my-4" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
