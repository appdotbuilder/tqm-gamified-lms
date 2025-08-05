
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema, 
  createCourseInputSchema, 
  createMissionInputSchema,
  createQuizInputSchema,
  submitQuizInputSchema,
  createAssignmentInputSchema,
  submitAssignmentInputSchema,
  createDiscussionPostInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getCourses } from './handlers/get_courses';
import { createCourse } from './handlers/create_course';
import { getMissionsByCourse } from './handlers/get_missions_by_course';
import { createMission } from './handlers/create_mission';
import { getLearningMaterials } from './handlers/get_learning_materials';
import { createQuiz } from './handlers/create_quiz';
import { submitQuiz } from './handlers/submit_quiz';
import { createAssignment } from './handlers/create_assignment';
import { submitAssignment } from './handlers/submit_assignment';
import { getStudentProgress } from './handlers/get_student_progress';
import { getLeaderboard } from './handlers/get_leaderboard';
import { getStudentBadges } from './handlers/get_student_badges';
import { createDiscussionPost } from './handlers/create_discussion_post';
import { getDiscussionPosts } from './handlers/get_discussion_posts';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Course management
  getCourses: publicProcedure
    .query(() => getCourses()),
  
  createCourse: publicProcedure
    .input(createCourseInputSchema)
    .mutation(({ input }) => createCourse(input)),

  // Mission management
  getMissionsByCourse: publicProcedure
    .input(z.object({ courseId: z.number() }))
    .query(({ input }) => getMissionsByCourse(input.courseId)),

  createMission: publicProcedure
    .input(createMissionInputSchema)
    .mutation(({ input }) => createMission(input)),

  // Learning materials
  getLearningMaterials: publicProcedure
    .input(z.object({ missionId: z.number() }))
    .query(({ input }) => getLearningMaterials(input.missionId)),

  // Quiz management
  createQuiz: publicProcedure
    .input(createQuizInputSchema)
    .mutation(({ input }) => createQuiz(input)),

  submitQuiz: publicProcedure
    .input(submitQuizInputSchema)
    .mutation(({ input }) => submitQuiz(input)),

  // Assignment management
  createAssignment: publicProcedure
    .input(createAssignmentInputSchema)
    .mutation(({ input }) => createAssignment(input)),

  submitAssignment: publicProcedure
    .input(submitAssignmentInputSchema)
    .mutation(({ input }) => submitAssignment(input)),

  // Student progress and gamification
  getStudentProgress: publicProcedure
    .input(z.object({ studentId: z.number(), courseId: z.number() }))
    .query(({ input }) => getStudentProgress(input.studentId, input.courseId)),

  getLeaderboard: publicProcedure
    .input(z.object({ courseId: z.number(), limit: z.number().optional() }))
    .query(({ input }) => getLeaderboard(input.courseId, input.limit)),

  getStudentBadges: publicProcedure
    .input(z.object({ studentId: z.number() }))
    .query(({ input }) => getStudentBadges(input.studentId)),

  // Discussion forums
  createDiscussionPost: publicProcedure
    .input(createDiscussionPostInputSchema)
    .mutation(({ input }) => createDiscussionPost(input)),

  getDiscussionPosts: publicProcedure
    .input(z.object({ forumId: z.number() }))
    .query(({ input }) => getDiscussionPosts(input.forumId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Gamified TQM Learning Management System TRPC server listening at port: ${port}`);
}

start();
