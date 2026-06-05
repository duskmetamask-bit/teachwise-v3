'use client';

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import type { UnitLesson, UnitPlan } from '@/lib/ai/prompts/units';

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
      .slice(0, 40) || 'unit'
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

function markdownParagraphs(md: string): Paragraph[] {
  if (!md.trim()) return [];
  return bodyParagraphs(md);
}

function lessonParagraphs(lesson: UnitLesson): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `Week ${lesson.weekNumber} · Lesson ${lesson.lessonNumber} — ${lesson.title}`,
          bold: true,
          size: 24,
          color: '1a1a24',
        }),
      ],
      spacing: { before: 240, after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'WALT: ', bold: true, size: 20 }),
        new TextRun({ text: lesson.walt, size: 20 }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Success criteria:', bold: true, size: 20 })],
      spacing: { after: 40 },
    }),
    ...lesson.successCriteria.map(
      (criterion) =>
        new Paragraph({
          children: [new TextRun({ text: `• ${criterion}`, size: 20 })],
          spacing: { after: 40 },
          indent: { left: 360 },
        }),
    ),
    ...bodyParagraphs(lesson.body),
  ];
}

type ExportInput = {
  topic: string;
  weeks: number;
  lessonsPerWeek: number;
  plan: Omit<UnitPlan, 'topic' | 'weeks' | 'lessonsPerWeek' | 'generatedAt'>;
};

export async function exportUnitAsDocx(input: ExportInput): Promise<void> {
  const { topic, weeks, lessonsPerWeek, plan } = input;
  const title = topic.trim() || 'Untitled unit';

  const children: Paragraph[] = [
    new Paragraph({
      text: `TeachWise — ${title}`,
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${weeks} ${weeks === 1 ? 'week' : 'weeks'} · ${lessonsPerWeek} lessons/week · Exported ${new Date().toLocaleString()}`,
          italics: true,
          size: 18,
          color: '6b6b7d',
        }),
      ],
      spacing: { after: 200 },
    }),
  ];

  if (plan.coverImageUrl) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Cover image: ${plan.coverImageUrl}`,
            italics: true,
            size: 18,
            color: '6b6b7d',
          }),
        ],
        spacing: { after: 120 },
      }),
    );
  }

  if (plan.overview) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Overview', bold: true, size: 26 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 80 },
      }),
      ...markdownParagraphs(plan.overview),
    );
  }

  if (plan.assessment) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Assessment', bold: true, size: 26 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 80 },
      }),
      ...markdownParagraphs(plan.assessment),
    );
  }

  if (plan.differentiation) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Differentiation', bold: true, size: 26 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 80 },
      }),
      ...markdownParagraphs(plan.differentiation),
    );
  }

  if (plan.ac9Codes.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'AC9 content descriptors', bold: true, size: 26 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: plan.ac9Codes.join(' · '), size: 20 })],
        spacing: { after: 120 },
      }),
    );
  }

  if (plan.resources.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Resources', bold: true, size: 26 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 80 },
      }),
      ...plan.resources.map(
        (resource) =>
          new Paragraph({
            children: [new TextRun({ text: `• ${resource}`, size: 20 })],
            indent: { left: 360 },
            spacing: { after: 40 },
          }),
      ),
    );
  }

  const sortedLessons = [...plan.lessons].sort((a, b) =>
    a.weekNumber === b.weekNumber ? a.lessonNumber - b.lessonNumber : a.weekNumber - b.weekNumber,
  );

  const weekNumbers = Array.from(new Set(sortedLessons.map((l) => l.weekNumber))).sort(
    (a, b) => a - b,
  );

  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Lessons', bold: true, size: 26 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 80 },
    }),
  );

  for (const week of weekNumbers) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Week ${week}`, bold: true, size: 24 })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 80 },
      }),
    );
    const inWeek = sortedLessons.filter((l) => l.weekNumber === week);
    for (const lesson of inWeek) {
      children.push(...lessonParagraphs(lesson));
    }
  }

  const doc = new Document({
    creator: 'TeachWise v3',
    title: `TeachWise — ${title}`,
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `teachwise-unit-${safeSlug(title)}-${timestampSlug()}.docx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
