
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { coursesTable, usersTable } from '../db/schema';
import { type CreateCourseInput, type CreateUserInput } from '../schema';
import { createCourse } from '../handlers/create_course';
import { eq } from 'drizzle-orm';

// Helper function to create a user
const createTestUser = async (role: 'student' | 'lecturer' | 'admin' = 'lecturer', username: string = 'testlecturer') => {
  const userInput: CreateUserInput = {
    username,
    email: `${username}@test.com`,
    password: 'password123',
    full_name: 'Test User',
    role
  };

  const result = await db.insert(usersTable)
    .values({
      username: userInput.username,
      email: userInput.email,
      password_hash: 'hashed_password',
      full_name: userInput.full_name,
      role: userInput.role
    })
    .returning()
    .execute();

  return result[0];
};

describe('createCourse', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a course with valid lecturer', async () => {
    // Create a lecturer first
    const lecturer = await createTestUser('lecturer');

    const testInput: CreateCourseInput = {
      name: 'Total Quality Management',
      description: 'Introduction to TQM principles and practices',
      lecturer_id: lecturer.id
    };

    const result = await createCourse(testInput);

    // Verify returned course data
    expect(result.name).toEqual('Total Quality Management');
    expect(result.description).toEqual('Introduction to TQM principles and practices');
    expect(result.lecturer_id).toEqual(lecturer.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save course to database', async () => {
    // Create a lecturer first
    const lecturer = await createTestUser('lecturer');

    const testInput: CreateCourseInput = {
      name: 'Quality Control Systems',
      description: 'Advanced quality control methodologies',
      lecturer_id: lecturer.id
    };

    const result = await createCourse(testInput);

    // Query database to verify course was saved
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, result.id))
      .execute();

    expect(courses).toHaveLength(1);
    expect(courses[0].name).toEqual('Quality Control Systems');
    expect(courses[0].description).toEqual('Advanced quality control methodologies');
    expect(courses[0].lecturer_id).toEqual(lecturer.id);
    expect(courses[0].created_at).toBeInstanceOf(Date);
    expect(courses[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create course with admin user', async () => {
    // Create an admin user
    const admin = await createTestUser('admin', 'testadmin');

    const testInput: CreateCourseInput = {
      name: 'Statistical Process Control',
      description: 'Using statistics in quality management',
      lecturer_id: admin.id
    };

    const result = await createCourse(testInput);

    expect(result.name).toEqual('Statistical Process Control');
    expect(result.lecturer_id).toEqual(admin.id);
  });

  it('should create course with null description', async () => {
    // Create a lecturer first
    const lecturer = await createTestUser('lecturer');

    const testInput: CreateCourseInput = {
      name: 'Lean Manufacturing',
      description: null,
      lecturer_id: lecturer.id
    };

    const result = await createCourse(testInput);

    expect(result.name).toEqual('Lean Manufacturing');
    expect(result.description).toBeNull();
    expect(result.lecturer_id).toEqual(lecturer.id);
  });

  it('should throw error when lecturer does not exist', async () => {
    const testInput: CreateCourseInput = {
      name: 'Non-existent Lecturer Course',
      description: 'This should fail',
      lecturer_id: 999999 // Non-existent ID
    };

    await expect(createCourse(testInput)).rejects.toThrow(/lecturer not found/i);
  });

  it('should throw error when user is not lecturer or admin', async () => {
    // Create a student user
    const student = await createTestUser('student', 'teststudent');

    const testInput: CreateCourseInput = {
      name: 'Unauthorized Course',
      description: 'This should fail',
      lecturer_id: student.id
    };

    await expect(createCourse(testInput)).rejects.toThrow(/must be a lecturer or admin/i);
  });
});
