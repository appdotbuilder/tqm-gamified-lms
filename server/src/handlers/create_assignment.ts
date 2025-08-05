
import { db } from '../db';
import { assignmentsTable } from '../db/schema';
import { type CreateAssignmentInput, type Assignment } from '../schema';

export const createAssignment = async (input: CreateAssignmentInput): Promise<Assignment> => {
  try {
    // Insert assignment record
    const result = await db.insert(assignmentsTable)
      .values({
        mission_id: input.mission_id,
        title: input.title,
        description: input.description,
        points_reward: input.points_reward,
        due_date: input.due_date,
        is_active: input.is_active
      })
      .returning()
      .execute();

    const assignment = result[0];
    return assignment;
  } catch (error) {
    console.error('Assignment creation failed:', error);
    throw error;
  }
};
