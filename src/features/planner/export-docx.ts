'use client';

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import type { PlannerBlock, PlannerState } from '@/lib/ai/prompts/planner';
import { KIND_META } from '@/features/planner/kind-meta';

function timestampSlug(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
}

function safeSlug(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'lesson'
  );
}

function bodyParagraphs(body: string): Paragraph[] {
  return body
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .map(
      (chunk) =>
        new Paragraph({
          children: [new TextRun({ text: chunk, size: 22 })],
          spacing: { after: 120 },
        }),
    );
}

function blockParagraphs(block: PlannerBlock, index: number): Paragraph[] {
  const meta = KIND_META[block.kind];
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `${index + 1}. ${meta.label} — ${block.heading}`,
          bold: true,
          size: 26,
          color: '1a1a24',
        }),
      ],
      spacing: { before: 280, after: 120 },
    }),
    ...bodyParagraphs(block.body),
    ...(block.imageUrl
      ? [
          new Paragraph({
            children: [
              new TextRun({
                text: `Image: ${block.imageUrl}`,
                italics: true,
                size: 18,
                color: '6b6b7d',
              }),
            ],
            spacing: { after: 60 },
          }),
        ]
      : []),
  ];
}

export async function exportPlannerAsDocx(state: PlannerState): Promise<void> {
  const title = state.topic.trim() || 'Untitled lesson';
  const children: Paragraph[] = [
    new Paragraph({
      text: `TeachWise — ${title}`,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${state.duration || 'Duration not set'} · Exported ${new Date().toLocaleString()}`,
          italics: true,
          size: 18,
          color: '6b6b7d',
        }),
      ],
      spacing: { after: 200 },
    }),
  ];

  state.blocks.forEach((block, index) => {
    children.push(...blockParagraphs(block, index));
  });

  const doc = new Document({
    creator: 'TeachWise v3',
    title: `TeachWise — ${title}`,
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `teachwise-${safeSlug(title)}-${timestampSlug()}.docx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
