
import { db } from '../db';
import { coursesTable, usersTable } from '../db/schema';
import { type CreateCourseInput, type Course } from '../schema';
import { eq } from 'drizzle-orm';

export const createCourse = async (input: CreateCourseInput): Promise<Course> => {
  try {
    // Verify lecturer exists and has correct role
    const lecturer = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.lecturer_id))
      .execute();

    if (lecturer.length === 0) {
      throw new Error('Lecturer not found');
    }

    if (lecturer[0].role !== 'lecturer' && lecturer[0].role !== 'admin') {
      throw new Error('User must be a lecturer or admin to create courses');
    }

    // Insert course record
    const result = await db.insert(coursesTable)
      .values({
        name: input.name,
        description: input.description,
        lecturer_id: input.lecturer_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Course creation failed:', error);
    throw error;
  }
};
