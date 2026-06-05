import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { generateImage, ImageAspectRatioSchema } from '@/lib/ai/image';

const ImageRequestSchema = z.object({
  prompt: z.string().min(1).max(1500),
  aspectRatio: ImageAspectRatioSchema.optional(),
});

export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = ImageRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400 });
  }

  const result = await generateImage({
    prompt: parsed.data.prompt,
    aspectRatio: parsed.data.aspectRatio ?? '16:9',
    count: 1,
    promptOptimizer: true,
  });

  if (!result.ok) {
    return Response.json({ error: result.error.message, kind: result.error.kind }, { status: 502 });
  }

  const url = result.value.urls[0];
  if (!url) {
    return Response.json({ error: 'No image URL returned by the gateway.' }, { status: 502 });
  }

  return Response.json({ url, revisedPrompt: result.value.revisedPrompt ?? null });
}
