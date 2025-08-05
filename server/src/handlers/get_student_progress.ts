
import { db } from '../db';
import { studentProgressTable } from '../db/schema';
import { type StudentProgress } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getStudentProgress(studentId: number, courseId: number): Promise<StudentProgress | null> {
  try {
    const results = await db.select()
      .from(studentProgressTable)
      .where(and(
        eq(studentProgressTable.student_id, studentId),
        eq(studentProgressTable.course_id, courseId)
      ))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const progress = results[0];
    return {
      id: progress.id,
      student_id: progress.student_id,
      course_id: progress.course_id,
      total_points: progress.total_points,
      current_level: progress.current_level,
      missions_completed: progress.missions_completed,
      last_activity: progress.last_activity,
      created_at: progress.created_at,
      updated_at: progress.updated_at
    };
  } catch (error) {
    console.error('Get student progress failed:', error);
    throw error;
  }
}
