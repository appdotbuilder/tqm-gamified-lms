
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, missionsTable, learningMaterialsTable } from '../db/schema';
import { getLearningMaterials } from '../handlers/get_learning_materials';

describe('getLearningMaterials', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return learning materials for a mission', async () => {
    // Create test data
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testlecturer',
        email: 'lecturer@test.com',
        password_hash: 'hash',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        name: 'TQM Fundamentals',
        description: 'Total Quality Management course',
        lecturer_id: userResult[0].id
      })
      .returning()
      .execute();

    const missionResult = await db.insert(missionsTable)
      .values({
        course_id: courseResult[0].id,
        title: 'Introduction to TQM',
        description: 'First meeting',
        meeting_number: 1,
        points_reward: 100
      })
      .returning()
      .execute();

    // Create learning materials
    await db.insert(learningMaterialsTable)
      .values([
        {
          mission_id: missionResult[0].id,
          title: 'TQM Lecture Slides',
          content: 'Introduction to quality management principles',
          material_type: 'lecture',
          file_url: 'https://example.com/slides.pdf'
        },
        {
          mission_id: missionResult[0].id,
          title: 'Quality Reading Material',
          content: 'Essential reading on TQM',
          material_type: 'reading',
          file_url: null
        },
        {
          mission_id: missionResult[0].id,
          title: 'TQM Video Tutorial',
          content: null,
          material_type: 'video',
          file_url: 'https://example.com/video.mp4'
        }
      ])
      .execute();

    const results = await getLearningMaterials(missionResult[0].id);

    expect(results).toHaveLength(3);
    
    // Check lecture material
    const lecturemat = results.find(m => m.material_type === 'lecture');
    expect(lecturemat).toBeDefined();
    expect(lecturemat!.title).toEqual('TQM Lecture Slides');
    expect(lecturemat!.content).toEqual('Introduction to quality management principles');
    expect(lecturemat!.file_url).toEqual('https://example.com/slides.pdf');

    // Check reading material
    const readingmat = results.find(m => m.material_type === 'reading');
    expect(readingmat).toBeDefined();
    expect(readingmat!.title).toEqual('Quality Reading Material');
    expect(readingmat!.content).toEqual('Essential reading on TQM');
    expect(readingmat!.file_url).toBeNull();

    // Check video material
    const videomat = results.find(m => m.material_type === 'video');
    expect(videomat).toBeDefined();
    expect(videomat!.title).toEqual('TQM Video Tutorial');
    expect(videomat!.content).toBeNull();
    expect(videomat!.file_url).toEqual('https://example.com/video.mp4');

    // Verify all materials belong to the correct mission
    results.forEach(material => {
      expect(material.mission_id).toEqual(missionResult[0].id);
      expect(material.id).toBeDefined();
      expect(material.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array for mission with no materials', async () => {
    // Create test data without materials
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testlecturer',
        email: 'lecturer@test.com',
        password_hash: 'hash',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        name: 'TQM Advanced',
        description: 'Advanced TQM course',
        lecturer_id: userResult[0].id
      })
      .returning()
      .execute();

    const missionResult = await db.insert(missionsTable)
      .values({
        course_id: courseResult[0].id,
        title: 'Advanced TQM',
        description: 'Second meeting',
        meeting_number: 2,
        points_reward: 150
      })
      .returning()
      .execute();

    const results = await getLearningMaterials(missionResult[0].id);

    expect(results).toHaveLength(0);
  });

  it('should return only materials for specified mission', async () => {
    // Create test data for multiple missions
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testlecturer',
        email: 'lecturer@test.com',
        password_hash: 'hash',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values({
        name: 'TQM Course',
        description: 'TQM course',
        lecturer_id: userResult[0].id
      })
      .returning()
      .execute();

    const mission1Result = await db.insert(missionsTable)
      .values({
        course_id: courseResult[0].id,
        title: 'Mission 1',
        description: 'First mission',
        meeting_number: 1,
        points_reward: 100
      })
      .returning()
      .execute();

    const mission2Result = await db.insert(missionsTable)
      .values({
        course_id: courseResult[0].id,
        title: 'Mission 2',
        description: 'Second mission',
        meeting_number: 2,
        points_reward: 150
      })
      .returning()
      .execute();

    // Create materials for both missions
    await db.insert(learningMaterialsTable)
      .values([
        {
          mission_id: mission1Result[0].id,
          title: 'Mission 1 Material',
          content: 'Content for mission 1',
          material_type: 'lecture'
        },
        {
          mission_id: mission2Result[0].id,
          title: 'Mission 2 Material',
          content: 'Content for mission 2',
          material_type: 'reading'
        }
      ])
      .execute();

    const results = await getLearningMaterials(mission1Result[0].id);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Mission 1 Material');
    expect(results[0].mission_id).toEqual(mission1Result[0].id);
  });
});
