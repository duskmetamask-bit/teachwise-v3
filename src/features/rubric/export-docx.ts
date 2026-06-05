'use client';

import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { Rubric } from '@/lib/ai/prompts/rubric';

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
      .slice(0, 40) || 'rubric'
  );
}

function headerCell(text: string, subtext: string | null): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20, color: '1a1a24' })],
      }),
      ...(subtext
        ? [
            new Paragraph({
              children: [new TextRun({ text: subtext, size: 16, italics: true, color: '6b6b7d' })],
            }),
          ]
        : []),
    ],
    shading: { fill: 'f3f4f6' },
  });
}

function bodyCell(text: string, isCriterionColumn: boolean): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            size: 18,
            bold: isCriterionColumn,
            color: isCriterionColumn ? '1a1a24' : '2a2a35',
          }),
        ],
        alignment: isCriterionColumn ? AlignmentType.LEFT : AlignmentType.LEFT,
      }),
    ],
  });
}

export async function exportRubricAsDocx(rubric: Rubric): Promise<void> {
  const title = rubric.title.trim() || 'Untitled rubric';
  const topic = rubric.topic.trim();

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      text: `TeachWise — ${title}`,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: topic,
          italics: true,
          size: 22,
          color: '2a2a35',
        }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Exported ${new Date().toLocaleString()}`,
          italics: true,
          size: 16,
          color: '6b6b7d',
        }),
      ],
      spacing: { after: 200 },
    }),
  ];

  if (rubric.ac9Codes.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'AC9 content descriptors: ', bold: true, size: 18 }),
          new TextRun({ text: rubric.ac9Codes.join(' · '), size: 18 }),
        ],
        spacing: { after: 200 },
      }),
    );
  }

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell('Criterion', null),
      ...rubric.levels.map((l) => headerCell(l.name, l.description || null)),
    ],
  });

  const bodyRows = rubric.criteria.map(
    (criterion) =>
      new TableRow({
        children: [
          bodyCell(criterion.name, true),
          ...rubric.levels.map((level) => bodyCell(criterion.descriptors[level.id] ?? '', false)),
        ],
      }),
  );

  children.push(
    new Table({
      rows: [headerRow, ...bodyRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
    }),
  );

  const doc = new Document({
    creator: 'TeachWise v3',
    title: `TeachWise — ${title}`,
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `teachwise-rubric-${safeSlug(title)}-${timestampSlug()}.docx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
