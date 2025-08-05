
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, studentProgressTable } from '../db/schema';
import { getLeaderboard } from '../handlers/get_leaderboard';

describe('getLeaderboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty leaderboard for course with no students', async () => {
    // Create lecturer and course
    const [lecturer] = await db.insert(usersTable)
      .values({
        username: 'lecturer1',
        email: 'lecturer@test.com',
        password_hash: 'hash123',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const [course] = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'A test course',
        lecturer_id: lecturer.id
      })
      .returning()
      .execute();

    const result = await getLeaderboard(course.id);

    expect(result).toHaveLength(0);
  });

  it('should return leaderboard ordered by total points', async () => {
    // Create lecturer and course
    const [lecturer] = await db.insert(usersTable)
      .values({
        username: 'lecturer1',
        email: 'lecturer@test.com',
        password_hash: 'hash123',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const [course] = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'A test course',
        lecturer_id: lecturer.id
      })
      .returning()
      .execute();

    // Create students
    const students = await db.insert(usersTable)
      .values([
        {
          username: 'student1',
          email: 'student1@test.com',
          password_hash: 'hash123',
          full_name: 'Alice Smith',
          role: 'student'
        },
        {
          username: 'student2',
          email: 'student2@test.com',
          password_hash: 'hash123',
          full_name: 'Bob Johnson',
          role: 'student'
        },
        {
          username: 'student3',
          email: 'student3@test.com',
          password_hash: 'hash123',
          full_name: 'Charlie Brown',
          role: 'student'
        }
      ])
      .returning()
      .execute();

    // Create student progress records with different scores
    await db.insert(studentProgressTable)
      .values([
        {
          student_id: students[0].id,
          course_id: course.id,
          total_points: 150,
          current_level: 3,
          missions_completed: 5
        },
        {
          student_id: students[1].id,
          course_id: course.id,
          total_points: 200,
          current_level: 4,
          missions_completed: 6
        },
        {
          student_id: students[2].id,
          course_id: course.id,
          total_points: 100,
          current_level: 2,
          missions_completed: 3
        }
      ])
      .execute();

    const result = await getLeaderboard(course.id);

    expect(result).toHaveLength(3);
    
    // Should be ordered by total points descending
    expect(result[0].student_name).toEqual('Bob Johnson');
    expect(result[0].total_points).toEqual(200);
    expect(result[0].rank).toEqual(1);
    
    expect(result[1].student_name).toEqual('Alice Smith');
    expect(result[1].total_points).toEqual(150);
    expect(result[1].rank).toEqual(2);
    
    expect(result[2].student_name).toEqual('Charlie Brown');
    expect(result[2].total_points).toEqual(100);
    expect(result[2].rank).toEqual(3);

    // Verify all fields are present
    result.forEach(entry => {
      expect(entry.student_id).toBeDefined();
      expect(entry.student_name).toBeDefined();
      expect(entry.total_points).toBeDefined();
      expect(entry.current_level).toBeDefined();
      expect(entry.missions_completed).toBeDefined();
      expect(entry.rank).toBeDefined();
    });
  });

  it('should respect the limit parameter', async () => {
    // Create lecturer and course
    const [lecturer] = await db.insert(usersTable)
      .values({
        username: 'lecturer1',
        email: 'lecturer@test.com',
        password_hash: 'hash123',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const [course] = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'A test course',
        lecturer_id: lecturer.id
      })
      .returning()
      .execute();

    // Create 5 students
    const students = await db.insert(usersTable)
      .values([
        { username: 'student1', email: 'student1@test.com', password_hash: 'hash123', full_name: 'Student 1', role: 'student' },
        { username: 'student2', email: 'student2@test.com', password_hash: 'hash123', full_name: 'Student 2', role: 'student' },
        { username: 'student3', email: 'student3@test.com', password_hash: 'hash123', full_name: 'Student 3', role: 'student' },
        { username: 'student4', email: 'student4@test.com', password_hash: 'hash123', full_name: 'Student 4', role: 'student' },
        { username: 'student5', email: 'student5@test.com', password_hash: 'hash123', full_name: 'Student 5', role: 'student' }
      ])
      .returning()
      .execute();

    // Create progress records
    await db.insert(studentProgressTable)
      .values(students.map((student, index) => ({
        student_id: student.id,
        course_id: course.id,
        total_points: (5 - index) * 100, // 500, 400, 300, 200, 100
        current_level: 5 - index,
        missions_completed: 5 - index
      })))
      .execute();

    const result = await getLeaderboard(course.id, 3);

    expect(result).toHaveLength(3);
    expect(result[0].total_points).toEqual(500);
    expect(result[1].total_points).toEqual(400);
    expect(result[2].total_points).toEqual(300);
  });

  it('should handle tie-breaking by missions completed', async () => {
    // Create lecturer and course
    const [lecturer] = await db.insert(usersTable)
      .values({
        username: 'lecturer1',
        email: 'lecturer@test.com',
        password_hash: 'hash123',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const [course] = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'A test course',
        lecturer_id: lecturer.id
      })
      .returning()
      .execute();

    // Create students with same points but different missions completed
    const students = await db.insert(usersTable)
      .values([
        { username: 'student1', email: 'student1@test.com', password_hash: 'hash123', full_name: 'Alice', role: 'student' },
        { username: 'student2', email: 'student2@test.com', password_hash: 'hash123', full_name: 'Bob', role: 'student' }
      ])
      .returning()
      .execute();

    await db.insert(studentProgressTable)
      .values([
        {
          student_id: students[0].id,
          course_id: course.id,
          total_points: 150,
          current_level: 3,
          missions_completed: 3
        },
        {
          student_id: students[1].id,
          course_id: course.id,
          total_points: 150,
          current_level: 3,
          missions_completed: 5
        }
      ])
      .execute();

    const result = await getLeaderboard(course.id);

    expect(result).toHaveLength(2);
    // Bob should be first due to more missions completed
    expect(result[0].student_name).toEqual('Bob');
    expect(result[0].missions_completed).toEqual(5);
    expect(result[0].rank).toEqual(1);
    
    expect(result[1].student_name).toEqual('Alice');
    expect(result[1].missions_completed).toEqual(3);
    expect(result[1].rank).toEqual(2);
  });

  it('should only return students from the specified course', async () => {
    // Create lecturer
    const [lecturer] = await db.insert(usersTable)
      .values({
        username: 'lecturer1',
        email: 'lecturer@test.com',
        password_hash: 'hash123',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();

    // Create two courses
    const courses = await db.insert(coursesTable)
      .values([
        { name: 'Course 1', description: 'First course', lecturer_id: lecturer.id },
        { name: 'Course 2', description: 'Second course', lecturer_id: lecturer.id }
      ])
      .returning()
      .execute();

    // Create students
    const students = await db.insert(usersTable)
      .values([
        { username: 'student1', email: 'student1@test.com', password_hash: 'hash123', full_name: 'Student 1', role: 'student' },
        { username: 'student2', email: 'student2@test.com', password_hash: 'hash123', full_name: 'Student 2', role: 'student' }
      ])
      .returning()
      .execute();

    // Create progress in both courses
    await db.insert(studentProgressTable)
      .values([
        { student_id: students[0].id, course_id: courses[0].id, total_points: 100, current_level: 2, missions_completed: 2 },
        { student_id: students[1].id, course_id: courses[1].id, total_points: 200, current_level: 3, missions_completed: 4 }
      ])
      .execute();

    const result = await getLeaderboard(courses[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].student_name).toEqual('Student 1');
    expect(result[0].total_points).toEqual(100);
  });
});
