
import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['student', 'lecturer', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  full_name: z.string(),
  role: userRoleSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type User = z.infer<typeof userSchema>;

// Course schema
export const courseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  lecturer_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type Course = z.infer<typeof courseSchema>;

// Mission/Meeting schema
export const missionSchema = z.object({
  id: z.number(),
  course_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  meeting_number: z.number().int(),
  points_reward: z.number().int(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type Mission = z.infer<typeof missionSchema>;

// Learning material schema
export const learningMaterialSchema = z.object({
  id: z.number(),
  mission_id: z.number(),
  title: z.string(),
  content: z.string().nullable(),
  material_type: z.enum(['lecture', 'reading', 'video', 'simulation']),
  file_url: z.string().nullable(),
  created_at: z.coerce.date()
});
export type LearningMaterial = z.infer<typeof learningMaterialSchema>;

// Quiz schema
export const quizSchema = z.object({
  id: z.number(),
  mission_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  points_reward: z.number().int(),
  time_limit_minutes: z.number().int().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date()
});
export type Quiz = z.infer<typeof quizSchema>;

// Quiz question schema
export const quizQuestionSchema = z.object({
  id: z.number(),
  quiz_id: z.number(),
  question_text: z.string(),
  question_type: z.enum(['multiple_choice', 'true_false', 'short_answer']),
  options: z.string().nullable(), // JSON string for multiple choice options
  correct_answer: z.string(),
  points: z.number().int(),
  order_index: z.number().int()
});
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

// Assignment schema
export const assignmentSchema = z.object({
  id: z.number(),
  mission_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  points_reward: z.number().int(),
  due_date: z.coerce.date().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date()
});
export type Assignment = z.infer<typeof assignmentSchema>;

// Student progress schema
export const studentProgressSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  course_id: z.number(),
  total_points: z.number().int(),
  current_level: z.number().int(),
  missions_completed: z.number().int(),
  last_activity: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type StudentProgress = z.infer<typeof studentProgressSchema>;

// Badge schema
export const badgeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  icon_url: z.string().nullable(),
  points_required: z.number().int().nullable(),
  criteria: z.string().nullable(), // JSON string for complex criteria
  created_at: z.coerce.date()
});
export type Badge = z.infer<typeof badgeSchema>;

// Student badge schema (many-to-many relationship)
export const studentBadgeSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  badge_id: z.number(),
  earned_at: z.coerce.date()
});
export type StudentBadge = z.infer<typeof studentBadgeSchema>;

// Quiz submission schema
export const quizSubmissionSchema = z.object({
  id: z.number(),
  quiz_id: z.number(),
  student_id: z.number(),
  answers: z.string(), // JSON string of answers
  score: z.number().int(),
  points_earned: z.number().int(),
  submitted_at: z.coerce.date()
});
export type QuizSubmission = z.infer<typeof quizSubmissionSchema>;

// Assignment submission schema
export const assignmentSubmissionSchema = z.object({
  id: z.number(),
  assignment_id: z.number(),
  student_id: z.number(),
  content: z.string().nullable(),
  file_url: z.string().nullable(),
  score: z.number().int().nullable(),
  points_earned: z.number().int().nullable(),
  feedback: z.string().nullable(),
  submitted_at: z.coerce.date(),
  graded_at: z.coerce.date().nullable()
});
export type AssignmentSubmission = z.infer<typeof assignmentSubmissionSchema>;

// Discussion forum schema
export const discussionForumSchema = z.object({
  id: z.number(),
  mission_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});
export type DiscussionForum = z.infer<typeof discussionForumSchema>;

// Discussion post schema
export const discussionPostSchema = z.object({
  id: z.number(),
  forum_id: z.number(),
  user_id: z.number(),
  content: z.string(),
  parent_post_id: z.number().nullable(), // For replies
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type DiscussionPost = z.infer<typeof discussionPostSchema>;

// Input schemas for creating/updating entities
export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1).max(100),
  role: userRoleSchema
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createCourseInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  lecturer_id: z.number()
});
export type CreateCourseInput = z.infer<typeof createCourseInputSchema>;

export const createMissionInputSchema = z.object({
  course_id: z.number(),
  title: z.string().min(1).max(200),
  description: z.string().nullable(),
  meeting_number: z.number().int().positive(),
  points_reward: z.number().int().nonnegative(),
  is_active: z.boolean().default(true)
});
export type CreateMissionInput = z.infer<typeof createMissionInputSchema>;

export const createQuizInputSchema = z.object({
  mission_id: z.number(),
  title: z.string().min(1).max(200),
  description: z.string().nullable(),
  points_reward: z.number().int().nonnegative(),
  time_limit_minutes: z.number().int().positive().nullable(),
  is_active: z.boolean().default(true)
});
export type CreateQuizInput = z.infer<typeof createQuizInputSchema>;

export const submitQuizInputSchema = z.object({
  quiz_id: z.number(),
  student_id: z.number(),
  answers: z.record(z.string()) // question_id -> answer mapping
});
export type SubmitQuizInput = z.infer<typeof submitQuizInputSchema>;

export const createAssignmentInputSchema = z.object({
  mission_id: z.number(),
  title: z.string().min(1).max(200),
  description: z.string().nullable(),
  points_reward: z.number().int().nonnegative(),
  due_date: z.coerce.date().nullable(),
  is_active: z.boolean().default(true)
});
export type CreateAssignmentInput = z.infer<typeof createAssignmentInputSchema>;

export const submitAssignmentInputSchema = z.object({
  assignment_id: z.number(),
  student_id: z.number(),
  content: z.string().nullable(),
  file_url: z.string().nullable()
});
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentInputSchema>;

export const createDiscussionPostInputSchema = z.object({
  forum_id: z.number(),
  user_id: z.number(),
  content: z.string().min(1),
  parent_post_id: z.number().nullable()
});
export type CreateDiscussionPostInput = z.infer<typeof createDiscussionPostInputSchema>;

// Leaderboard entry schema
export const leaderboardEntrySchema = z.object({
  student_id: z.number(),
  student_name: z.string(),
  total_points: z.number().int(),
  current_level: z.number().int(),
  missions_completed: z.number().int(),
  rank: z.number().int()
});
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
