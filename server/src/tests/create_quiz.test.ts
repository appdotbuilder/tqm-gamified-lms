
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, missionsTable, quizzesTable } from '../db/schema';
import { type CreateQuizInput } from '../schema';
import { createQuiz } from '../handlers/create_quiz';
import { eq } from 'drizzle-orm';

describe('createQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test input with all required fields
  const testInput: CreateQuizInput = {
    mission_id: 1,
    title: 'Test Quiz',
    description: 'A quiz for testing',
    points_reward: 50,
    time_limit_minutes: 30,
    is_active: true
  };

  it('should create a quiz', async () => {
    // Create prerequisite data first
    const lecturer = await db.insert(usersTable)
      .values({
        username: 'lecturer1',
        email: 'lecturer@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const course = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'A test course',
        lecturer_id: lecturer[0].id
      })
      .returning()
      .execute();

    const mission = await db.insert(missionsTable)
      .values({
        course_id: course[0].id,
        title: 'Test Mission',
        description: 'A test mission',
        meeting_number: 1,
        points_reward: 100,
        is_active: true
      })
      .returning()
      .execute();

    const input = { ...testInput, mission_id: mission[0].id };
    const result = await createQuiz(input);

    // Basic field validation
    expect(result.title).toEqual('Test Quiz');
    expect(result.description).toEqual('A quiz for testing');
    expect(result.points_reward).toEqual(50);
    expect(result.time_limit_minutes).toEqual(30);
    expect(result.is_active).toEqual(true);
    expect(result.mission_id).toEqual(mission[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save quiz to database', async () => {
    // Create prerequisite data first
    const lecturer = await db.insert(usersTable)
      .values({
        username: 'lecturer2',
        email: 'lecturer2@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Lecturer 2',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const course = await db.insert(coursesTable)
      .values({
        name: 'Test Course 2',
        description: 'A test course 2',
        lecturer_id: lecturer[0].id
      })
      .returning()
      .execute();

    const mission = await db.insert(missionsTable)
      .values({
        course_id: course[0].id,
        title: 'Test Mission 2',
        description: 'A test mission 2',
        meeting_number: 1,
        points_reward: 100,
        is_active: true
      })
      .returning()
      .execute();

    const input = { ...testInput, mission_id: mission[0].id };
    const result = await createQuiz(input);

    // Query database to verify save
    const quizzes = await db.select()
      .from(quizzesTable)
      .where(eq(quizzesTable.id, result.id))
      .execute();

    expect(quizzes).toHaveLength(1);
    expect(quizzes[0].title).toEqual('Test Quiz');
    expect(quizzes[0].description).toEqual('A quiz for testing');
    expect(quizzes[0].points_reward).toEqual(50);
    expect(quizzes[0].time_limit_minutes).toEqual(30);
    expect(quizzes[0].is_active).toEqual(true);
    expect(quizzes[0].mission_id).toEqual(mission[0].id);
    expect(quizzes[0].created_at).toBeInstanceOf(Date);
  });

  it('should create quiz with null description and time limit', async () => {
    // Create prerequisite data first
    const lecturer = await db.insert(usersTable)
      .values({
        username: 'lecturer3',
        email: 'lecturer3@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Lecturer 3',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const course = await db.insert(coursesTable)
      .values({
        name: 'Test Course 3',
        description: 'A test course 3',
        lecturer_id: lecturer[0].id
      })
      .returning()
      .execute();

    const mission = await db.insert(missionsTable)
      .values({
        course_id: course[0].id,
        title: 'Test Mission 3',
        description: 'A test mission 3',
        meeting_number: 1,
        points_reward: 100,
        is_active: true
      })
      .returning()
      .execute();

    const inputWithNulls: CreateQuizInput = {
      mission_id: mission[0].id,
      title: 'Quiz with Nulls',
      description: null,
      points_reward: 25,
      time_limit_minutes: null,
      is_active: false
    };

    const result = await createQuiz(inputWithNulls);

    expect(result.title).toEqual('Quiz with Nulls');
    expect(result.description).toBeNull();
    expect(result.points_reward).toEqual(25);
    expect(result.time_limit_minutes).toBeNull();
    expect(result.is_active).toEqual(false);
    expect(result.mission_id).toEqual(mission[0].id);
  });

  it('should throw error for non-existent mission', async () => {
    const inputWithInvalidMission = { ...testInput, mission_id: 999 };

    await expect(createQuiz(inputWithInvalidMission)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
