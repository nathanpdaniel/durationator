// This file is an AI-assisted user guide, allowing users to ask questions about the application and receive AI-generated explanations and instructions.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UserGuideInputSchema = z.object({
  query: z.string().describe('The user question about how to use the application.'),
});
export type UserGuideInput = z.infer<typeof UserGuideInputSchema>;

const UserGuideOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user question.'),
});
export type UserGuideOutput = z.infer<typeof UserGuideOutputSchema>;

export async function aiAssistedUserGuide(input: UserGuideInput): Promise<UserGuideOutput> {
  return aiAssistedUserGuideFlow(input);
}

const userGuidePrompt = ai.definePrompt({
  name: 'userGuidePrompt',
  input: {schema: UserGuideInputSchema},
  output: {schema: UserGuideOutputSchema},
  prompt: `You are a helpful AI assistant that provides clear and concise instructions on how to use the Durationator application.

  The Durationator application allows users to input a list of durations (hours and minutes), calculate the total duration, specify a target duration, and calculate the remaining duration until the target is reached.

  Answer the following question about the application:
  {{{query}}}`,
});

const aiAssistedUserGuideFlow = ai.defineFlow(
  {
    name: 'aiAssistedUserGuideFlow',
    inputSchema: UserGuideInputSchema,
    outputSchema: UserGuideOutputSchema,
  },
  async input => {
    const {output} = await userGuidePrompt(input);
    return output!;
  }
);
