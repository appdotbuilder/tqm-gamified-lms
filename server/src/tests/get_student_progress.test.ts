
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, studentProgressTable } from '../db/schema';
import { getStudentProgress } from '../handlers/get_student_progress';

describe('getStudentProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return student progress when it exists', async () => {
    // Create test user (student)
    const studentResult = await db.insert(usersTable)
      .values({
        username: 'student1',
        email: 'student1@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Student',
        role: 'student'
      })
      .returning()
      .execute();
    const studentId = studentResult[0].id;

    // Create test user (lecturer)
    const lecturerResult = await db.insert(usersTable)
      .values({
        username: 'lecturer1',
        email: 'lecturer1@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();
    const lecturerId = lecturerResult[0].id;

    // Create test course
    const courseResult = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'A test course',
        lecturer_id: lecturerId
      })
      .returning()
      .execute();
    const courseId = courseResult[0].id;

    // Create student progress
    const progressResult = await db.insert(studentProgressTable)
      .values({
        student_id: studentId,
        course_id: courseId,
        total_points: 150,
        current_level: 3,
        missions_completed: 5
      })
      .returning()
      .execute();

    const result = await getStudentProgress(studentId, courseId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(progressResult[0].id);
    expect(result!.student_id).toEqual(studentId);
    expect(result!.course_id).toEqual(courseId);
    expect(result!.total_points).toEqual(150);
    expect(result!.current_level).toEqual(3);
    expect(result!.missions_completed).toEqual(5);
    expect(result!.last_activity).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when progress does not exist for student-course combination', async () => {
    // Create test user (student)
    const studentResult = await db.insert(usersTable)
      .values({
        username: 'student1',
        email: 'student1@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Student',
        role: 'student'
      })
      .returning()
      .execute();
    const studentId = studentResult[0].id;

    // Create test user (lecturer)
    const lecturerResult = await db.insert(usersTable)
      .values({
        username: 'lecturer1',
        email: 'lecturer1@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();
    const lecturerId = lecturerResult[0].id;

    // Create test course
    const courseResult = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'A test course',
        lecturer_id: lecturerId
      })
      .returning()
      .execute();
    const courseId = courseResult[0].id;

    // Don't create any progress record
    const result = await getStudentProgress(studentId, courseId);

    expect(result).toBeNull();
  });

  it('should return null when student exists but course does not match', async () => {
    // Create test users
    const studentResult = await db.insert(usersTable)
      .values({
        username: 'student1',
        email: 'student1@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Student',
        role: 'student'
      })
      .returning()
      .execute();
    const studentId = studentResult[0].id;

    const lecturerResult = await db.insert(usersTable)
      .values({
        username: 'lecturer1',
        email: 'lecturer1@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();
    const lecturerId = lecturerResult[0].id;

    // Create two courses
    const course1Result = await db.insert(coursesTable)
      .values({
        name: 'Course 1',
        description: 'First course',
        lecturer_id: lecturerId
      })
      .returning()
      .execute();
    const course1Id = course1Result[0].id;

    const course2Result = await db.insert(coursesTable)
      .values({
        name: 'Course 2',
        description: 'Second course',
        lecturer_id: lecturerId
      })
      .returning()
      .execute();
    const course2Id = course2Result[0].id;

    // Create progress for course 1
    await db.insert(studentProgressTable)
      .values({
        student_id: studentId,
        course_id: course1Id,
        total_points: 100,
        current_level: 2,
        missions_completed: 3
      })
      .execute();

    // Query for course 2 (should return null)
    const result = await getStudentProgress(studentId, course2Id);

    expect(result).toBeNull();
  });

  it('should handle default values correctly', async () => {
    // Create test users
    const studentResult = await db.insert(usersTable)
      .values({
        username: 'student1',
        email: 'student1@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Student',
        role: 'student'
      })
      .returning()
      .execute();
    const studentId = studentResult[0].id;

    const lecturerResult = await db.insert(usersTable)
      .values({
        username: 'lecturer1',
        email: 'lecturer1@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();
    const lecturerId = lecturerResult[0].id;

    // Create test course
    const courseResult = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'A test course',
        lecturer_id: lecturerId
      })
      .returning()
      .execute();
    const courseId = courseResult[0].id;

    // Create progress with only required fields (should use defaults)
    await db.insert(studentProgressTable)
      .values({
        student_id: studentId,
        course_id: courseId
      })
      .execute();

    const result = await getStudentProgress(studentId, courseId);

    expect(result).not.toBeNull();
    expect(result!.student_id).toEqual(studentId);
    expect(result!.course_id).toEqual(courseId);
    expect(result!.total_points).toEqual(0); // Default value
    expect(result!.current_level).toEqual(1); // Default value
    expect(result!.missions_completed).toEqual(0); // Default value
    expect(result!.last_activity).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});
