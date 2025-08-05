
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { assignmentsTable, usersTable, coursesTable, missionsTable } from '../db/schema';
import { type CreateAssignmentInput } from '../schema';
import { createAssignment } from '../handlers/create_assignment';
import { eq } from 'drizzle-orm';

describe('createAssignment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testLecturerId: number;
  let testCourseId: number;
  let testMissionId: number;

  beforeEach(async () => {
    // Create test lecturer
    const lecturerResult = await db.insert(usersTable)
      .values({
        username: 'test_lecturer',
        email: 'lecturer@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();
    testLecturerId = lecturerResult[0].id;

    // Create test course
    const courseResult = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'A course for testing',
        lecturer_id: testLecturerId
      })
      .returning()
      .execute();
    testCourseId = courseResult[0].id;

    // Create test mission
    const missionResult = await db.insert(missionsTable)
      .values({
        course_id: testCourseId,
        title: 'Test Mission',
        description: 'A mission for testing',
        meeting_number: 1,
        points_reward: 50,
        is_active: true
      })
      .returning()
      .execute();
    testMissionId = missionResult[0].id;
  });

  const testInput: CreateAssignmentInput = {
    mission_id: 0, // Will be set in test
    title: 'Test Assignment',
    description: 'An assignment for testing',
    points_reward: 100,
    due_date: new Date('2024-12-31'),
    is_active: true
  };

  it('should create an assignment', async () => {
    const input = { ...testInput, mission_id: testMissionId };
    const result = await createAssignment(input);

    // Basic field validation
    expect(result.title).toEqual('Test Assignment');
    expect(result.description).toEqual(testInput.description);
    expect(result.mission_id).toEqual(testMissionId);
    expect(result.points_reward).toEqual(100);
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save assignment to database', async () => {
    const input = { ...testInput, mission_id: testMissionId };
    const result = await createAssignment(input);

    // Query using proper drizzle syntax
    const assignments = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.id, result.id))
      .execute();

    expect(assignments).toHaveLength(1);
    expect(assignments[0].title).toEqual('Test Assignment');
    expect(assignments[0].description).toEqual(testInput.description);
    expect(assignments[0].mission_id).toEqual(testMissionId);
    expect(assignments[0].points_reward).toEqual(100);
    expect(assignments[0].due_date).toEqual(new Date('2024-12-31'));
    expect(assignments[0].is_active).toEqual(true);
    expect(assignments[0].created_at).toBeInstanceOf(Date);
  });

  it('should create assignment with null due date', async () => {
    const input = { ...testInput, mission_id: testMissionId, due_date: null };
    const result = await createAssignment(input);

    expect(result.due_date).toBeNull();
    expect(result.title).toEqual('Test Assignment');
    expect(result.points_reward).toEqual(100);

    // Verify in database
    const assignments = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.id, result.id))
      .execute();

    expect(assignments[0].due_date).toBeNull();
  });

  it('should create assignment with null description', async () => {
    const input = { ...testInput, mission_id: testMissionId, description: null };
    const result = await createAssignment(input);

    expect(result.description).toBeNull();
    expect(result.title).toEqual('Test Assignment');
    expect(result.points_reward).toEqual(100);

    // Verify in database
    const assignments = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.id, result.id))
      .execute();

    expect(assignments[0].description).toBeNull();
  });

  it('should fail when mission_id does not exist', async () => {
    const input = { ...testInput, mission_id: 99999 };

    await expect(createAssignment(input)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
