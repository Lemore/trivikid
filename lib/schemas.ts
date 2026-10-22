import { z } from "zod";

// Shared request/response shapes for POST /api/question (see spec/ARCHITECTURE.md, Data Model).
// This module has no server-only imports, so the client can use it too.

export const TOPIC_MAX_LENGTH = 50;

export const QuestionRequestSchema = z.object({
  topic: z.string().trim().min(1).max(TOPIC_MAX_LENGTH),
  previousQuestions: z.array(z.string()).default([]),
});

export type QuestionRequest = z.input<typeof QuestionRequestSchema>;

const OkResponseSchema = z.object({
  status: z.literal("ok"),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
});

const StatusResponseSchema = z.object({
  status: z.enum(["unclear_topic", "no_new_question", "error"]),
});

export const QuestionResponseSchema = z.discriminatedUnion("status", [
  OkResponseSchema,
  StatusResponseSchema,
]);

export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;
export type TriviaQuestion = z.infer<typeof OkResponseSchema>;

// The structured output format sent to the AI model. All fields are required;
// for non-"ok" statuses the model returns empty strings and an empty array.
export const AiQuestionSchema = z.object({
  status: z.enum(["ok", "unclear_topic", "no_new_question"]),
  question: z.string(),
  options: z.array(z.string()),
  correctOptionText: z.string(),
  explanation: z.string(),
});

export type AiQuestion = z.infer<typeof AiQuestionSchema>;
