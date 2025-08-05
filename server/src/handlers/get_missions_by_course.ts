
import { db } from '../db';
import { missionsTable } from '../db/schema';
import { type Mission } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getMissionsByCourse = async (courseId: number): Promise<Mission[]> => {
  try {
    const results = await db.select()
      .from(missionsTable)
      .where(eq(missionsTable.course_id, courseId))
      .orderBy(asc(missionsTable.meeting_number))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch missions by course:', error);
    throw error;
  }
};
