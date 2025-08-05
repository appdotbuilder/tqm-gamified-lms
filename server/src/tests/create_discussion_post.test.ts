
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, missionsTable, discussionForumsTable, discussionPostsTable } from '../db/schema';
import { type CreateDiscussionPostInput } from '../schema';
import { createDiscussionPost } from '../handlers/create_discussion_post';
import { eq } from 'drizzle-orm';

describe('createDiscussionPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser: any;
  let testForum: any;

  beforeEach(async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'student'
      })
      .returning()
      .execute();
    testUser = users[0];

    // Create lecturer user
    const lecturers = await db.insert(usersTable)
      .values({
        username: 'lecturer',
        email: 'lecturer@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();

    // Create test course
    const courses = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'A test course',
        lecturer_id: lecturers[0].id
      })
      .returning()
      .execute();

    // Create test mission
    const missions = await db.insert(missionsTable)
      .values({
        course_id: courses[0].id,
        title: 'Test Mission',
        description: 'A test mission',
        meeting_number: 1,
        points_reward: 10,
        is_active: true
      })
      .returning()
      .execute();

    // Create test forum
    const forums = await db.insert(discussionForumsTable)
      .values({
        mission_id: missions[0].id,
        title: 'Test Forum',
        description: 'A test forum'
      })
      .returning()
      .execute();
    testForum = forums[0];
  });

  it('should create a discussion post', async () => {
    const input: CreateDiscussionPostInput = {
      forum_id: testForum.id,
      user_id: testUser.id,
      content: 'This is a test discussion post',
      parent_post_id: null
    };

    const result = await createDiscussionPost(input);

    expect(result.forum_id).toEqual(testForum.id);
    expect(result.user_id).toEqual(testUser.id);
    expect(result.content).toEqual('This is a test discussion post');
    expect(result.parent_post_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save discussion post to database', async () => {
    const input: CreateDiscussionPostInput = {
      forum_id: testForum.id,
      user_id: testUser.id,
      content: 'This is a test discussion post',
      parent_post_id: null
    };

    const result = await createDiscussionPost(input);

    const posts = await db.select()
      .from(discussionPostsTable)
      .where(eq(discussionPostsTable.id, result.id))
      .execute();

    expect(posts).toHaveLength(1);
    expect(posts[0].content).toEqual('This is a test discussion post');
    expect(posts[0].forum_id).toEqual(testForum.id);
    expect(posts[0].user_id).toEqual(testUser.id);
    expect(posts[0].parent_post_id).toBeNull();
  });

  it('should create a reply to existing post', async () => {
    // Create parent post first
    const parentInput: CreateDiscussionPostInput = {
      forum_id: testForum.id,
      user_id: testUser.id,
      content: 'This is the parent post',
      parent_post_id: null
    };

    const parentPost = await createDiscussionPost(parentInput);

    // Create reply
    const replyInput: CreateDiscussionPostInput = {
      forum_id: testForum.id,
      user_id: testUser.id,
      content: 'This is a reply to the parent post',
      parent_post_id: parentPost.id
    };

    const result = await createDiscussionPost(replyInput);

    expect(result.parent_post_id).toEqual(parentPost.id);
    expect(result.content).toEqual('This is a reply to the parent post');
    expect(result.forum_id).toEqual(testForum.id);
  });

  it('should throw error for non-existent forum', async () => {
    const input: CreateDiscussionPostInput = {
      forum_id: 99999,
      user_id: testUser.id,
      content: 'This post should fail',
      parent_post_id: null
    };

    await expect(createDiscussionPost(input)).rejects.toThrow(/forum not found/i);
  });

  it('should throw error for non-existent user', async () => {
    const input: CreateDiscussionPostInput = {
      forum_id: testForum.id,
      user_id: 99999,
      content: 'This post should fail',
      parent_post_id: null
    };

    await expect(createDiscussionPost(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error for non-existent parent post', async () => {
    const input: CreateDiscussionPostInput = {
      forum_id: testForum.id,
      user_id: testUser.id,
      content: 'This reply should fail',
      parent_post_id: 99999
    };

    await expect(createDiscussionPost(input)).rejects.toThrow(/parent post not found/i);
  });

  it('should throw error when parent post belongs to different forum', async () => {
    // Create another forum
    const lecturer = await db.insert(usersTable)
      .values({
        username: 'lecturer2',
        email: 'lecturer2@example.com',
        password_hash: 'hashed_password',
        full_name: 'Another Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const course = await db.insert(coursesTable)
      .values({
        name: 'Another Course',
        description: 'Another test course',
        lecturer_id: lecturer[0].id
      })
      .returning()
      .execute();

    const mission = await db.insert(missionsTable)
      .values({
        course_id: course[0].id,
        title: 'Another Mission',
        description: 'Another test mission',
        meeting_number: 1,
        points_reward: 10,
        is_active: true
      })
      .returning()
      .execute();

    const anotherForum = await db.insert(discussionForumsTable)
      .values({
        mission_id: mission[0].id,
        title: 'Another Forum',
        description: 'Another test forum'
      })
      .returning()
      .execute();

    // Create post in another forum
    const postInAnotherForum = await db.insert(discussionPostsTable)
      .values({
        forum_id: anotherForum[0].id,
        user_id: testUser.id,
        content: 'Post in another forum'
      })
      .returning()
      .execute();

    // Try to reply to that post from original forum
    const input: CreateDiscussionPostInput = {
      forum_id: testForum.id,
      user_id: testUser.id,
      content: 'This reply should fail',
      parent_post_id: postInAnotherForum[0].id
    };

    await expect(createDiscussionPost(input)).rejects.toThrow(/parent post must belong to the same forum/i);
  });
});
