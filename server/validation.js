import { z } from 'zod';
export const uuid = z.uuid();
export const subject = z.enum(['maths','physics','life-sci','english']);
export const language = z.enum(['English','Afrikaans','Setswana']);
export const email = z.email().max(254).transform(s => s.trim().toLowerCase());
export const password = z.string().min(12, 'Use at least 12 characters.').max(128)
  .refine(s => !['password1234','123456789012','Password123!','password123!','abcdefghijkl'].includes(s), 'Choose a less common password.');
export const name = z.string().trim().min(2).max(80);
export const answers = z.record(uuid, z.number().int().min(0).max(3)).refine(v => Object.keys(v).length <= 50);
export const question = z.object({
  topic: z.string().trim().min(1).max(100), prompt: z.string().trim().min(3).max(3000),
  options: z.array(z.string().trim().min(1).max(500)).length(4),
  correctIndex: z.number().int().min(0).max(3), explanation: z.string().trim().min(3).max(3000),
}).strict();
export const assessment = z.object({
  title: z.string().trim().min(3).max(140), description: z.string().trim().max(1500).default(''),
  subject, grade: z.number().int().min(11).max(12), classId: uuid.nullable(),
  durationMinutes: z.number().int().min(5).max(180),
  questions: z.array(question).min(1).max(50),
}).strict();
export const chat = z.object({
  threadId: uuid, requestId: uuid, message: z.string().trim().min(1).max(4000),
}).strict();
export const parse = (schema, value) => schema.parse(value);
