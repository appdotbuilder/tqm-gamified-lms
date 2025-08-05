
import { db } from '../db';
import { quizzesTable } from '../db/schema';
import { type CreateQuizInput, type Quiz } from '../schema';

export const createQuiz = async (input: CreateQuizInput): Promise<Quiz> => {
  try {
    // Insert quiz record
    const result = await db.insert(quizzesTable)
      .values({
        mission_id: input.mission_id,
        title: input.title,
        description: input.description,
        points_reward: input.points_reward,
        time_limit_minutes: input.time_limit_minutes,
        is_active: input.is_active
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Quiz creation failed:', error);
    throw error;
  }
};
