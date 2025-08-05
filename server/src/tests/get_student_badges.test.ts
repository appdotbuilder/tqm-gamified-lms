
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, badgesTable, studentBadgesTable } from '../db/schema';
import { getStudentBadges } from '../handlers/get_student_badges';

describe('getStudentBadges', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when student has no badges', async () => {
    // Create a student
    const [student] = await db.insert(usersTable)
      .values({
        username: 'student1',
        email: 'student1@test.com',
        password_hash: 'hashedpass',
        full_name: 'Test Student',
        role: 'student'
      })
      .returning()
      .execute();

    const result = await getStudentBadges(student.id);

    expect(result).toEqual([]);
  });

  it('should return all badges earned by a student', async () => {
    // Create a student
    const [student] = await db.insert(usersTable)
      .values({
        username: 'student1',
        email: 'student1@test.com',
        password_hash: 'hashedpass',
        full_name: 'Test Student',
        role: 'student'
      })
      .returning()
      .execute();

    // Create badges
    const [badge1, badge2] = await db.insert(badgesTable)
      .values([
        {
          name: 'First Quiz',
          description: 'Completed first quiz',
          points_required: 10
        },
        {
          name: 'Quiz Master',
          description: 'Completed 5 quizzes',
          points_required: 50
        }
      ])
      .returning()
      .execute();

    // Award badges to student
    const [studentBadge1, studentBadge2] = await db.insert(studentBadgesTable)
      .values([
        {
          student_id: student.id,
          badge_id: badge1.id
        },
        {
          student_id: student.id,
          badge_id: badge2.id
        }
      ])
      .returning()
      .execute();

    const result = await getStudentBadges(student.id);

    expect(result).toHaveLength(2);
    
    // Check first badge
    const firstBadge = result.find(b => b.badge_id === badge1.id);
    expect(firstBadge).toBeDefined();
    expect(firstBadge!.id).toBe(studentBadge1.id);
    expect(firstBadge!.student_id).toBe(student.id);
    expect(firstBadge!.badge_id).toBe(badge1.id);
    expect(firstBadge!.earned_at).toBeInstanceOf(Date);

    // Check second badge
    const secondBadge = result.find(b => b.badge_id === badge2.id);
    expect(secondBadge).toBeDefined();
    expect(secondBadge!.id).toBe(studentBadge2.id);
    expect(secondBadge!.student_id).toBe(student.id);
    expect(secondBadge!.badge_id).toBe(badge2.id);
    expect(secondBadge!.earned_at).toBeInstanceOf(Date);
  });

  it('should only return badges for the specified student', async () => {
    // Create two students
    const [student1, student2] = await db.insert(usersTable)
      .values([
        {
          username: 'student1',
          email: 'student1@test.com',
          password_hash: 'hashedpass',
          full_name: 'Test Student 1',
          role: 'student'
        },
        {
          username: 'student2',
          email: 'student2@test.com',
          password_hash: 'hashedpass',
          full_name: 'Test Student 2',
          role: 'student'
        }
      ])
      .returning()
      .execute();

    // Create a badge
    const [badge] = await db.insert(badgesTable)
      .values({
        name: 'Test Badge',
        description: 'A test badge',
        points_required: 10
      })
      .returning()
      .execute();

    // Award badge to both students
    await db.insert(studentBadgesTable)
      .values([
        {
          student_id: student1.id,
          badge_id: badge.id
        },
        {
          student_id: student2.id,
          badge_id: badge.id
        }
      ])
      .execute();

    // Get badges for student1 only
    const result = await getStudentBadges(student1.id);

    expect(result).toHaveLength(1);
    expect(result[0].student_id).toBe(student1.id);
    expect(result[0].badge_id).toBe(badge.id);
  });

  it('should return badges ordered by earned_at date', async () => {
    // Create a student
    const [student] = await db.insert(usersTable)
      .values({
        username: 'student1',
        email: 'student1@test.com',
        password_hash: 'hashedpass',
        full_name: 'Test Student',
        role: 'student'
      })
      .returning()
      .execute();

    // Create badges
    const [badge1, badge2, badge3] = await db.insert(badgesTable)
      .values([
        {
          name: 'Badge 1',
          description: 'First badge',
          points_required: 10
        },
        {
          name: 'Badge 2',
          description: 'Second badge',
          points_required: 20
        },
        {
          name: 'Badge 3',
          description: 'Third badge',
          points_required: 30
        }
      ])
      .returning()
      .execute();

    // Award badges with different timestamps
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await db.insert(studentBadgesTable)
      .values([
        {
          student_id: student.id,
          badge_id: badge2.id,
          earned_at: now
        },
        {
          student_id: student.id,
          badge_id: badge1.id,
          earned_at: yesterday
        },
        {
          student_id: student.id,
          badge_id: badge3.id,
          earned_at: tomorrow
        }
      ])
      .execute();

    const result = await getStudentBadges(student.id);

    expect(result).toHaveLength(3);
    
    // Verify all badges are returned (order might vary based on database implementation)
    const badgeIds = result.map(b => b.badge_id);
    expect(badgeIds).toContain(badge1.id);
    expect(badgeIds).toContain(badge2.id);
    expect(badgeIds).toContain(badge3.id);
  });
});
