
import { db } from '../db';
import { missionsTable } from '../db/schema';
import { type CreateMissionInput, type Mission } from '../schema';

export const createMission = async (input: CreateMissionInput): Promise<Mission> => {
  try {
    // Insert mission record
    const result = await db.insert(missionsTable)
      .values({
        course_id: input.course_id,
        title: input.title,
        description: input.description,
        meeting_number: input.meeting_number,
        points_reward: input.points_reward,
        is_active: input.is_active
      })
      .returning()
      .execute();

    const mission = result[0];
    return mission;
  } catch (error) {
    console.error('Mission creation failed:', error);
    throw error;
  }
};
