export {
  generateText,
  streamText,
  type AiError,
  type Result,
  type Message,
  type TeacherPrefs,
} from '@/lib/ai';
export { generateImage, type ImageGenInput, type ImageGenOutput } from '@/lib/ai/image';
export { synthesizeSpeech, transcribeSpeech, type TtsInput, type SttInput } from '@/lib/ai/speech';
