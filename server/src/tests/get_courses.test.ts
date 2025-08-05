
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { coursesTable, usersTable } from '../db/schema';
import { type CreateUserInput, type CreateCourseInput } from '../schema';
import { getCourses } from '../handlers/get_courses';

// Test user input (lecturer)
const testLecturer: CreateUserInput = {
  username: 'testlecturer',
  email: 'lecturer@test.com',
  password: 'password123',
  full_name: 'Test Lecturer',
  role: 'lecturer'
};

// Test course inputs
const testCourse1: CreateCourseInput = {
  name: 'Introduction to Programming',
  description: 'Learn the basics of programming',
  lecturer_id: 1 // Will be set after creating lecturer
};

const testCourse2: CreateCourseInput = {
  name: 'Advanced Mathematics',
  description: 'Advanced mathematical concepts',
  lecturer_id: 1 // Will be set after creating lecturer
};

describe('getCourses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no courses exist', async () => {
    const result = await getCourses();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all courses', async () => {
    // Create prerequisite lecturer
    const lecturerResult = await db.insert(usersTable)
      .values({
        username: testLecturer.username,
        email: testLecturer.email,
        password_hash: 'hashed_password',
        full_name: testLecturer.full_name,
        role: testLecturer.role
      })
      .returning()
      .execute();

    const lecturerId = lecturerResult[0].id;

    // Create test courses
    await db.insert(coursesTable)
      .values([
        {
          ...testCourse1,
          lecturer_id: lecturerId
        },
        {
          ...testCourse2,
          lecturer_id: lecturerId
        }
      ])
      .execute();

    const result = await getCourses();

    expect(result).toHaveLength(2);
    
    // Verify course 1
    const course1 = result.find(c => c.name === 'Introduction to Programming');
    expect(course1).toBeDefined();
    expect(course1?.description).toEqual('Learn the basics of programming');
    expect(course1?.lecturer_id).toEqual(lecturerId);
    expect(course1?.id).toBeDefined();
    expect(course1?.created_at).toBeInstanceOf(Date);
    expect(course1?.updated_at).toBeInstanceOf(Date);

    // Verify course 2
    const course2 = result.find(c => c.name === 'Advanced Mathematics');
    expect(course2).toBeDefined();
    expect(course2?.description).toEqual('Advanced mathematical concepts');
    expect(course2?.lecturer_id).toEqual(lecturerId);
    expect(course2?.id).toBeDefined();
    expect(course2?.created_at).toBeInstanceOf(Date);
    expect(course2?.updated_at).toBeInstanceOf(Date);
  });

  it('should return courses with null descriptions', async () => {
    // Create prerequisite lecturer
    const lecturerResult = await db.insert(usersTable)
      .values({
        username: testLecturer.username,
        email: testLecturer.email,
        password_hash: 'hashed_password',
        full_name: testLecturer.full_name,
        role: testLecturer.role
      })
      .returning()
      .execute();

    const lecturerId = lecturerResult[0].id;

    // Create course with null description
    await db.insert(coursesTable)
      .values({
        name: 'Course Without Description',
        description: null,
        lecturer_id: lecturerId
      })
      .execute();

    const result = await getCourses();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Course Without Description');
    expect(result[0].description).toBeNull();
    expect(result[0].lecturer_id).toEqual(lecturerId);
  });
});
