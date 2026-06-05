'use client';

import type { PlannerBlock } from '@/lib/ai/prompts/planner';
import { BlockCard } from '@/features/planner/block-card';

type BlocksListProps = {
  blocks: PlannerBlock[];
  topic: string;
  onRegenerateBlock: (block: PlannerBlock) => Promise<void>;
  onGenerateImage: (block: PlannerBlock, prompt: string) => Promise<void>;
  onEditBlock: (id: string, heading: string, body: string) => void;
  onDeleteBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: 'up' | 'down') => void;
};

export function BlocksList({
  blocks,
  topic,
  onRegenerateBlock,
  onGenerateImage,
  onEditBlock,
  onDeleteBlock,
  onMoveBlock,
}: BlocksListProps) {
  if (blocks.length === 0) return null;
  return (
    <ol className="flex flex-col gap-4">
      {blocks.map((block, index) => (
        <li key={block.id}>
          <BlockCard
            block={block}
            index={index}
            total={blocks.length}
            topic={topic}
            onRegenerateText={() => onRegenerateBlock(block)}
            onGenerateImage={(prompt) => onGenerateImage(block, prompt)}
            onEdit={(heading, body) => onEditBlock(block.id, heading, body)}
            onDelete={() => onDeleteBlock(block.id)}
            onMove={(direction) => onMoveBlock(block.id, direction)}
          />
        </li>
      ))}
    </ol>
  );
}
