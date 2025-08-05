
import { db } from '../db';
import { studentProgressTable, usersTable } from '../db/schema';
import { type LeaderboardEntry } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getLeaderboard(courseId: number, limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    // Query student progress with user information for the specific course
    const results = await db.select({
      student_id: studentProgressTable.student_id,
      student_name: usersTable.full_name,
      total_points: studentProgressTable.total_points,
      current_level: studentProgressTable.current_level,
      missions_completed: studentProgressTable.missions_completed,
    })
      .from(studentProgressTable)
      .innerJoin(usersTable, eq(studentProgressTable.student_id, usersTable.id))
      .where(eq(studentProgressTable.course_id, courseId))
      .orderBy(desc(studentProgressTable.total_points), desc(studentProgressTable.missions_completed))
      .limit(limit)
      .execute();

    // Add rank to each entry based on order
    return results.map((result, index) => ({
      student_id: result.student_id,
      student_name: result.student_name,
      total_points: result.total_points,
      current_level: result.current_level,
      missions_completed: result.missions_completed,
      rank: index + 1,
    }));
  } catch (error) {
    console.error('Leaderboard query failed:', error);
    throw error;
  }
}
