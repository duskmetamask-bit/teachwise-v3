'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '@/lib/ai';
import { fadeInUp } from '@/lib/motion';
import { InlineMarkdown } from './inline-markdown';

type MessagesProps = {
  messages: Message[];
  status: 'idle' | 'sending' | 'streaming' | 'error';
};

export function Messages({ messages, status }: MessagesProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <ul
      role="log"
      aria-label="Chat transcript"
      aria-relevant="additions"
      className="flex flex-col gap-6"
    >
      <AnimatePresence initial={false}>
        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          const isLast = index === messages.length - 1;
          const isStreamingPlaceholder =
            !isUser && isLast && status === 'streaming' && message.content === '';

          return (
            <motion.li
              key={`${message.role}-${index}`}
              layout
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
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
                  isUser
                    ? 'bg-accent text-accent-fg'
                    : 'bg-surface-raised text-fg border-border-subtle border'
                }`}
              >
                {isUser ? (
                  <InlineMarkdown content={message.content} />
                ) : isStreamingPlaceholder ? (
                  <span className="text-fg-subtle inline-flex items-center gap-1.5 italic">
                    Thinking
                    <span className="caret" aria-hidden />
                  </span>
                ) : (
                  <MarkdownContent content={message.content} />
                )}
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-fg mt-3 mb-1.5 text-lg font-semibold">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-fg mt-3 mb-1.5 text-base font-semibold">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-fg mt-3 mb-1 text-sm font-semibold">{children}</h3>
          ),
          p: ({ children }) => <p className="text-fg my-1.5 leading-relaxed">{children}</p>,
          ul: ({ children }) => (
            <ul className="text-fg my-1.5 ml-5 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="text-fg my-1.5 ml-5 list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="text-fg font-semibold">{children}</strong>,
          em: ({ children }) => <em className="text-fg italic">{children}</em>,
          code: ({ children }) => (
            <code className="bg-surface-sunken text-fg rounded px-1.5 py-0.5 font-mono text-[0.85em]">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-surface-sunken border-border-subtle text-fg my-3 max-h-96 overflow-auto rounded-lg border p-3 font-mono text-[0.85em]">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-border-subtle text-fg-muted my-3 border-l-2 pl-3">
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
              <table className="border-border-subtle text-caption w-full border-collapse border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-surface-sunken text-fg">{children}</thead>,
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
