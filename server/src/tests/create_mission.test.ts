
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { missionsTable, usersTable, coursesTable } from '../db/schema';
import { type CreateMissionInput } from '../schema';
import { createMission } from '../handlers/create_mission';
import { eq } from 'drizzle-orm';

describe('createMission', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testInput: CreateMissionInput = {
    course_id: 1,
    title: 'Introduction to Programming',
    description: 'First meeting covering basic programming concepts',
    meeting_number: 1,
    points_reward: 50,
    is_active: true
  };

  it('should create a mission', async () => {
    // Create prerequisite data
    const lecturer = await db.insert(usersTable)
      .values({
        username: 'prof_smith',
        email: 'smith@university.edu',
        password_hash: 'hashed_password',
        full_name: 'Professor Smith',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const course = await db.insert(coursesTable)
      .values({
        name: 'Computer Science 101',
        description: 'Introduction to Computer Science',
        lecturer_id: lecturer[0].id
      })
      .returning()
      .execute();

    const missionInput = {
      ...testInput,
      course_id: course[0].id
    };

    const result = await createMission(missionInput);

    // Basic field validation
    expect(result.title).toEqual('Introduction to Programming');
    expect(result.description).toEqual('First meeting covering basic programming concepts');
    expect(result.course_id).toEqual(course[0].id);
    expect(result.meeting_number).toEqual(1);
    expect(result.points_reward).toEqual(50);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save mission to database', async () => {
    // Create prerequisite data
    const lecturer = await db.insert(usersTable)
      .values({
        username: 'prof_johnson',
        email: 'johnson@university.edu',
        password_hash: 'hashed_password',
        full_name: 'Professor Johnson',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const course = await db.insert(coursesTable)
      .values({
        name: 'Mathematics 101',
        description: 'Introduction to Mathematics',
        lecturer_id: lecturer[0].id
      })
      .returning()
      .execute();

    const missionInput = {
      ...testInput,
      course_id: course[0].id,
      title: 'Linear Algebra Basics'
    };

    const result = await createMission(missionInput);

    // Query database to verify persistence
    const missions = await db.select()
      .from(missionsTable)
      .where(eq(missionsTable.id, result.id))
      .execute();

    expect(missions).toHaveLength(1);
    expect(missions[0].title).toEqual('Linear Algebra Basics');
    expect(missions[0].course_id).toEqual(course[0].id);
    expect(missions[0].meeting_number).toEqual(1);
    expect(missions[0].points_reward).toEqual(50);
    expect(missions[0].is_active).toEqual(true);
    expect(missions[0].created_at).toBeInstanceOf(Date);
    expect(missions[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable description', async () => {
    // Create prerequisite data
    const lecturer = await db.insert(usersTable)
      .values({
        username: 'prof_davis',
        email: 'davis@university.edu',
        password_hash: 'hashed_password',
        full_name: 'Professor Davis',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const course = await db.insert(coursesTable)
      .values({
        name: 'Physics 101',
        description: 'Introduction to Physics',
        lecturer_id: lecturer[0].id
      })
      .returning()
      .execute();

    const missionInput = {
      ...testInput,
      course_id: course[0].id,
      description: null
    };

    const result = await createMission(missionInput);

    expect(result.description).toBeNull();
    expect(result.title).toEqual('Introduction to Programming');
    expect(result.course_id).toEqual(course[0].id);
  });

  it('should fail with invalid course_id', async () => {
    const missionInput = {
      ...testInput,
      course_id: 999 // Non-existent course
    };

    await expect(createMission(missionInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
