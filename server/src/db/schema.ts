
import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['student', 'lecturer', 'admin']);
export const materialTypeEnum = pgEnum('material_type', ['lecture', 'reading', 'video', 'simulation']);
export const questionTypeEnum = pgEnum('question_type', ['multiple_choice', 'true_false', 'short_answer']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name').notNull(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Courses table
export const coursesTable = pgTable('courses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  lecturer_id: integer('lecturer_id').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Missions/Meetings table
export const missionsTable = pgTable('missions', {
  id: serial('id').primaryKey(),
  course_id: integer('course_id').notNull().references(() => coursesTable.id),
  title: text('title').notNull(),
  description: text('description'),
  meeting_number: integer('meeting_number').notNull(),
  points_reward: integer('points_reward').notNull().default(0),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Learning materials table
export const learningMaterialsTable = pgTable('learning_materials', {
  id: serial('id').primaryKey(),
  mission_id: integer('mission_id').notNull().references(() => missionsTable.id),
  title: text('title').notNull(),
  content: text('content'),
  material_type: materialTypeEnum('material_type').notNull(),
  file_url: text('file_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Quizzes table
export const quizzesTable = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  mission_id: integer('mission_id').notNull().references(() => missionsTable.id),
  title: text('title').notNull(),
  description: text('description'),
  points_reward: integer('points_reward').notNull().default(0),
  time_limit_minutes: integer('time_limit_minutes'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Quiz questions table
export const quizQuestionsTable = pgTable('quiz_questions', {
  id: serial('id').primaryKey(),
  quiz_id: integer('quiz_id').notNull().references(() => quizzesTable.id),
  question_text: text('question_text').notNull(),
  question_type: questionTypeEnum('question_type').notNull(),
  options: text('options'), // JSON string for multiple choice options
  correct_answer: text('correct_answer').notNull(),
  points: integer('points').notNull().default(1),
  order_index: integer('order_index').notNull(),
});

// Assignments table
export const assignmentsTable = pgTable('assignments', {
  id: serial('id').primaryKey(),
  mission_id: integer('mission_id').notNull().references(() => missionsTable.id),
  title: text('title').notNull(),
  description: text('description'),
  points_reward: integer('points_reward').notNull().default(0),
  due_date: timestamp('due_date'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Student progress table
export const studentProgressTable = pgTable('student_progress', {
  id: serial('id').primaryKey(),
  student_id: integer('student_id').notNull().references(() => usersTable.id),
  course_id: integer('course_id').notNull().references(() => coursesTable.id),
  total_points: integer('total_points').notNull().default(0),
  current_level: integer('current_level').notNull().default(1),
  missions_completed: integer('missions_completed').notNull().default(0),
  last_activity: timestamp('last_activity').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Badges table
export const badgesTable = pgTable('badges', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon_url: text('icon_url'),
  points_required: integer('points_required'),
  criteria: text('criteria'), // JSON string for complex criteria
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Student badges table (many-to-many relationship)
export const studentBadgesTable = pgTable('student_badges', {
  id: serial('id').primaryKey(),
  student_id: integer('student_id').notNull().references(() => usersTable.id),
  badge_id: integer('badge_id').notNull().references(() => badgesTable.id),
  earned_at: timestamp('earned_at').defaultNow().notNull(),
});

// Quiz submissions table
export const quizSubmissionsTable = pgTable('quiz_submissions', {
  id: serial('id').primaryKey(),
  quiz_id: integer('quiz_id').notNull().references(() => quizzesTable.id),
  student_id: integer('student_id').notNull().references(() => usersTable.id),
  answers: text('answers').notNull(), // JSON string of answers
  score: integer('score').notNull(),
  points_earned: integer('points_earned').notNull(),
  submitted_at: timestamp('submitted_at').defaultNow().notNull(),
});

// Assignment submissions table
export const assignmentSubmissionsTable = pgTable('assignment_submissions', {
  id: serial('id').primaryKey(),
  assignment_id: integer('assignment_id').notNull().references(() => assignmentsTable.id),
  student_id: integer('student_id').notNull().references(() => usersTable.id),
  content: text('content'),
  file_url: text('file_url'),
  score: integer('score'),
  points_earned: integer('points_earned'),
  feedback: text('feedback'),
  submitted_at: timestamp('submitted_at').defaultNow().notNull(),
  graded_at: timestamp('graded_at'),
});

// Discussion forums table
export const discussionForumsTable = pgTable('discussion_forums', {
  id: serial('id').primaryKey(),
  mission_id: integer('mission_id').notNull().references(() => missionsTable.id),
  title: text('title').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Discussion posts table - defined without self-reference first
export const discussionPostsTable = pgTable('discussion_posts', {
  id: serial('id').primaryKey(),
  forum_id: integer('forum_id').notNull().references(() => discussionForumsTable.id),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  content: text('content').notNull(),
  parent_post_id: integer('parent_post_id'), // Self-reference without immediate constraint
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  courses: many(coursesTable),
  progress: many(studentProgressTable),
  badges: many(studentBadgesTable),
  quizSubmissions: many(quizSubmissionsTable),
  assignmentSubmissions: many(assignmentSubmissionsTable),
  discussionPosts: many(discussionPostsTable),
}));

export const coursesRelations = relations(coursesTable, ({ one, many }) => ({
  lecturer: one(usersTable, {
    fields: [coursesTable.lecturer_id],
    references: [usersTable.id],
  }),
  missions: many(missionsTable),
  studentProgress: many(studentProgressTable),
}));

export const missionsRelations = relations(missionsTable, ({ one, many }) => ({
  course: one(coursesTable, {
    fields: [missionsTable.course_id],
    references: [coursesTable.id],
  }),
  materials: many(learningMaterialsTable),
  quizzes: many(quizzesTable),
  assignments: many(assignmentsTable),
  discussionForums: many(discussionForumsTable),
}));

export const quizzesRelations = relations(quizzesTable, ({ one, many }) => ({
  mission: one(missionsTable, {
    fields: [quizzesTable.mission_id],
    references: [missionsTable.id],
  }),
  questions: many(quizQuestionsTable),
  submissions: many(quizSubmissionsTable),
}));

export const studentProgressRelations = relations(studentProgressTable, ({ one }) => ({
  student: one(usersTable, {
    fields: [studentProgressTable.student_id],
    references: [usersTable.id],
  }),
  course: one(coursesTable, {
    fields: [studentProgressTable.course_id],
    references: [coursesTable.id],
  }),
}));

export const discussionPostsRelations = relations(discussionPostsTable, ({ one, many }) => ({
  forum: one(discussionForumsTable, {
    fields: [discussionPostsTable.forum_id],
    references: [discussionForumsTable.id],
  }),
  user: one(usersTable, {
    fields: [discussionPostsTable.user_id],
    references: [usersTable.id],
  }),
  parentPost: one(discussionPostsTable, {
    fields: [discussionPostsTable.parent_post_id],
    references: [discussionPostsTable.id],
    relationName: 'parentPost',
  }),
  replies: many(discussionPostsTable, {
    relationName: 'parentPost',
  }),
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  courses: coursesTable,
  missions: missionsTable,
  learningMaterials: learningMaterialsTable,
  quizzes: quizzesTable,
  quizQuestions: quizQuestionsTable,
  assignments: assignmentsTable,
  studentProgress: studentProgressTable,
  badges: badgesTable,
  studentBadges: studentBadgesTable,
  quizSubmissions: quizSubmissionsTable,
  assignmentSubmissions: assignmentSubmissionsTable,
  discussionForums: discussionForumsTable,
  discussionPosts: discussionPostsTable,
};
