'use client';

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import type { Message } from '@/lib/ai';

function timestampSlug(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
}

function roleLabel(role: Message['role']): string {
  if (role === 'user') return 'Teacher';
  if (role === 'assistant') return 'TeachWise';
  return 'System';
}

function buildDoc(messages: Message[]): Document {
  const children: Paragraph[] = [
    new Paragraph({
      text: 'TeachWise — Conversation Export',
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Exported on ${new Date().toLocaleString()}`,
          italics: true,
          size: 18,
          color: '6b6b7d',
        }),
      ],
    }),
    new Paragraph({ text: '' }),
  ];

  for (const message of messages) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: roleLabel(message.role),
            bold: true,
            size: 22,
            color: message.role === 'user' ? '7c3aed' : '1a1a24',
          }),
        ],
        spacing: { before: 240, after: 80 },
      }),
    );

    const blocks = message.content.split(/\n{2,}/);
    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) continue;
      children.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed, size: 22 })],
          spacing: { after: 100 },
        }),
      );
    }
  }

  return new Document({
    creator: 'TeachWise v3',
    title: 'TeachWise Conversation',
    sections: [{ children }],
  });
}

export async function exportConversationAsDocx(messages: Message[]): Promise<void> {
  const doc = buildDoc(messages);
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `teachwise-conversation-${timestampSlug()}.docx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
