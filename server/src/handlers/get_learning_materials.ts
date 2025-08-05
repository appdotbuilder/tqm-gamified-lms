
import { db } from '../db';
import { learningMaterialsTable } from '../db/schema';
import { type LearningMaterial } from '../schema';
import { eq } from 'drizzle-orm';

export const getLearningMaterials = async (missionId: number): Promise<LearningMaterial[]> => {
  try {
    const results = await db.select()
      .from(learningMaterialsTable)
      .where(eq(learningMaterialsTable.mission_id, missionId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get learning materials:', error);
    throw error;
  }
};
