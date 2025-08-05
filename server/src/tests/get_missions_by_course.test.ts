
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, missionsTable } from '../db/schema';
import { getMissionsByCourse } from '../handlers/get_missions_by_course';

describe('getMissionsByCourse', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return missions for a specific course ordered by meeting number', async () => {
    // Create a lecturer first
    const lecturerResult = await db.insert(usersTable)
      .values({
        username: 'testlecturer',
        email: 'lecturer@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();
    const lecturerId = lecturerResult[0].id;

    // Create a course
    const courseResult = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'A test course',
        lecturer_id: lecturerId
      })
      .returning()
      .execute();
    const courseId = courseResult[0].id;

    // Create missions with different meeting numbers (out of order)
    await db.insert(missionsTable)
      .values([
        {
          course_id: courseId,
          title: 'Mission 3',
          description: 'Third mission',
          meeting_number: 3,
          points_reward: 30,
          is_active: true
        },
        {
          course_id: courseId,
          title: 'Mission 1',
          description: 'First mission',
          meeting_number: 1,
          points_reward: 10,
          is_active: true
        },
        {
          course_id: courseId,
          title: 'Mission 2',
          description: 'Second mission',
          meeting_number: 2,
          points_reward: 20,
          is_active: false
        }
      ])
      .execute();

    const missions = await getMissionsByCourse(courseId);

    expect(missions).toHaveLength(3);
    
    // Verify missions are ordered by meeting number
    expect(missions[0].title).toBe('Mission 1');
    expect(missions[0].meeting_number).toBe(1);
    expect(missions[0].points_reward).toBe(10);
    expect(missions[0].is_active).toBe(true);
    
    expect(missions[1].title).toBe('Mission 2');
    expect(missions[1].meeting_number).toBe(2);
    expect(missions[1].points_reward).toBe(20);
    expect(missions[1].is_active).toBe(false);
    
    expect(missions[2].title).toBe('Mission 3');
    expect(missions[2].meeting_number).toBe(3);
    expect(missions[2].points_reward).toBe(30);
    expect(missions[2].is_active).toBe(true);

    // Verify all missions have required fields
    missions.forEach(mission => {
      expect(mission.id).toBeDefined();
      expect(mission.course_id).toBe(courseId);
      expect(mission.created_at).toBeInstanceOf(Date);
      expect(mission.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for course with no missions', async () => {
    // Create a lecturer first
    const lecturerResult = await db.insert(usersTable)
      .values({
        username: 'testlecturer',
        email: 'lecturer@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();
    const lecturerId = lecturerResult[0].id;

    // Create a course with no missions
    const courseResult = await db.insert(coursesTable)
      .values({
        name: 'Empty Course',
        description: 'A course with no missions',
        lecturer_id: lecturerId
      })
      .returning()
      .execute();
    const courseId = courseResult[0].id;

    const missions = await getMissionsByCourse(courseId);

    expect(missions).toHaveLength(0);
  });

  it('should return only missions for the specified course', async () => {
    // Create a lecturer first
    const lecturerResult = await db.insert(usersTable)
      .values({
        username: 'testlecturer',
        email: 'lecturer@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();
    const lecturerId = lecturerResult[0].id;

    // Create two courses
    const coursesResult = await db.insert(coursesTable)
      .values([
        {
          name: 'Course 1',
          description: 'First course',
          lecturer_id: lecturerId
        },
        {
          name: 'Course 2',
          description: 'Second course',
          lecturer_id: lecturerId
        }
      ])
      .returning()
      .execute();
    const course1Id = coursesResult[0].id;
    const course2Id = coursesResult[1].id;

    // Create missions for both courses
    await db.insert(missionsTable)
      .values([
        {
          course_id: course1Id,
          title: 'Course 1 Mission',
          description: 'Mission for course 1',
          meeting_number: 1,
          points_reward: 10,
          is_active: true
        },
        {
          course_id: course2Id,
          title: 'Course 2 Mission',
          description: 'Mission for course 2',
          meeting_number: 1,
          points_reward: 15,
          is_active: true
        }
      ])
      .execute();

    const course1Missions = await getMissionsByCourse(course1Id);
    const course2Missions = await getMissionsByCourse(course2Id);

    expect(course1Missions).toHaveLength(1);
    expect(course1Missions[0].title).toBe('Course 1 Mission');
    expect(course1Missions[0].course_id).toBe(course1Id);

    expect(course2Missions).toHaveLength(1);
    expect(course2Missions[0].title).toBe('Course 2 Mission');
    expect(course2Missions[0].course_id).toBe(course2Id);
  });
});
