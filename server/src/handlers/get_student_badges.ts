
import { db } from '../db';
import { studentBadgesTable, badgesTable } from '../db/schema';
import { type StudentBadge } from '../schema';
import { eq } from 'drizzle-orm';

export async function getStudentBadges(studentId: number): Promise<StudentBadge[]> {
  try {
    const results = await db.select()
      .from(studentBadgesTable)
      .innerJoin(badgesTable, eq(studentBadgesTable.badge_id, badgesTable.id))
      .where(eq(studentBadgesTable.student_id, studentId))
      .execute();

    return results.map(result => ({
      id: result.student_badges.id,
      student_id: result.student_badges.student_id,
      badge_id: result.student_badges.badge_id,
      earned_at: result.student_badges.earned_at
    }));
  } catch (error) {
    console.error('Failed to get student badges:', error);
    throw error;
  }
}
