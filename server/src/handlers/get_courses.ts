
import { db } from '../db';
import { coursesTable } from '../db/schema';
import { type Course } from '../schema';

export const getCourses = async (): Promise<Course[]> => {
  try {
    const result = await db.select()
      .from(coursesTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Get courses failed:', error);
    throw error;
  }
};
