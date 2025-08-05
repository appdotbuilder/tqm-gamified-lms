
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, missionsTable, discussionForumsTable, discussionPostsTable } from '../db/schema';
import { getDiscussionPosts } from '../handlers/get_discussion_posts';

describe('getDiscussionPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for forum with no posts', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'lecturer1',
        email: 'lecturer@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const [course] = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'A test course',
        lecturer_id: user.id
      })
      .returning()
      .execute();

    const [mission] = await db.insert(missionsTable)
      .values({
        course_id: course.id,
        title: 'Test Mission',
        description: 'A test mission',
        meeting_number: 1,
        points_reward: 10
      })
      .returning()
      .execute();

    const [forum] = await db.insert(discussionForumsTable)
      .values({
        mission_id: mission.id,
        title: 'Test Forum',
        description: 'A test discussion forum'
      })
      .returning()
      .execute();

    const result = await getDiscussionPosts(forum.id);

    expect(result).toEqual([]);
  });

  it('should return discussion posts for a forum', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'student1',
        email: 'student@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Student',
        role: 'student'
      })
      .returning()
      .execute();

    const [lecturer] = await db.insert(usersTable)
      .values({
        username: 'lecturer1',
        email: 'lecturer@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const [course] = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'A test course',
        lecturer_id: lecturer.id
      })
      .returning()
      .execute();

    const [mission] = await db.insert(missionsTable)
      .values({
        course_id: course.id,
        title: 'Test Mission',
        description: 'A test mission',
        meeting_number: 1,
        points_reward: 10
      })
      .returning()
      .execute();

    const [forum] = await db.insert(discussionForumsTable)
      .values({
        mission_id: mission.id,
        title: 'Test Forum',
        description: 'A test discussion forum'
      })
      .returning()
      .execute();

    // Create discussion posts
    const [post1] = await db.insert(discussionPostsTable)
      .values({
        forum_id: forum.id,
        user_id: user.id,
        content: 'First post content',
        parent_post_id: null
      })
      .returning()
      .execute();

    const [post2] = await db.insert(discussionPostsTable)
      .values({
        forum_id: forum.id,
        user_id: lecturer.id,
        content: 'Second post content',
        parent_post_id: null
      })
      .returning()
      .execute();

    const result = await getDiscussionPosts(forum.id);

    expect(result).toHaveLength(2);
    expect(result[0].content).toEqual('First post content');
    expect(result[0].forum_id).toEqual(forum.id);
    expect(result[0].user_id).toEqual(user.id);
    expect(result[0].parent_post_id).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].content).toEqual('Second post content');
    expect(result[1].forum_id).toEqual(forum.id);
    expect(result[1].user_id).toEqual(lecturer.id);
    expect(result[1].parent_post_id).toBeNull();
  });

  it('should return posts with nested replies in chronological order', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'student1',
        email: 'student@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Student',
        role: 'student'
      })
      .returning()
      .execute();

    const [lecturer] = await db.insert(usersTable)
      .values({
        username: 'lecturer1',
        email: 'lecturer@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const [course] = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'A test course',
        lecturer_id: lecturer.id
      })
      .returning()
      .execute();

    const [mission] = await db.insert(missionsTable)
      .values({
        course_id: course.id,
        title: 'Test Mission',
        description: 'A test mission',
        meeting_number: 1,
        points_reward: 10
      })
      .returning()
      .execute();

    const [forum] = await db.insert(discussionForumsTable)
      .values({
        mission_id: mission.id,
        title: 'Test Forum',
        description: 'A test discussion forum'
      })
      .returning()
      .execute();

    // Create parent post
    const [parentPost] = await db.insert(discussionPostsTable)
      .values({
        forum_id: forum.id,
        user_id: user.id,
        content: 'Parent post content',
        parent_post_id: null
      })
      .returning()
      .execute();

    // Create reply post
    const [replyPost] = await db.insert(discussionPostsTable)
      .values({
        forum_id: forum.id,
        user_id: lecturer.id,
        content: 'Reply post content',
        parent_post_id: parentPost.id
      })
      .returning()
      .execute();

    const result = await getDiscussionPosts(forum.id);

    expect(result).toHaveLength(2);
    
    // Posts should be ordered by created_at (chronological order)
    expect(result[0].content).toEqual('Parent post content');
    expect(result[0].parent_post_id).toBeNull();
    
    expect(result[1].content).toEqual('Reply post content');
    expect(result[1].parent_post_id).toEqual(parentPost.id);
    
    // Verify reply references parent correctly
    expect(result[1].parent_post_id).toEqual(result[0].id);
  });

  it('should only return posts for the specified forum', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        username: 'student1',
        email: 'student@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Student',
        role: 'student'
      })
      .returning()
      .execute();

    const [lecturer] = await db.insert(usersTable)
      .values({
        username: 'lecturer1',
        email: 'lecturer@test.com',
        password_hash: 'hashed_password',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();

    const [course] = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'A test course',
        lecturer_id: lecturer.id
      })
      .returning()
      .execute();

    const [mission] = await db.insert(missionsTable)
      .values({
        course_id: course.id,
        title: 'Test Mission',
        description: 'A test mission',
        meeting_number: 1,
        points_reward: 10
      })
      .returning()
      .execute();

    // Create two forums
    const [forum1] = await db.insert(discussionForumsTable)
      .values({
        mission_id: mission.id,
        title: 'Forum 1',
        description: 'First forum'
      })
      .returning()
      .execute();

    const [forum2] = await db.insert(discussionForumsTable)
      .values({
        mission_id: mission.id,
        title: 'Forum 2',
        description: 'Second forum'
      })
      .returning()
      .execute();

    // Create posts in both forums
    await db.insert(discussionPostsTable)
      .values({
        forum_id: forum1.id,
        user_id: user.id,
        content: 'Post in forum 1',
        parent_post_id: null
      })
      .execute();

    await db.insert(discussionPostsTable)
      .values({
        forum_id: forum2.id,
        user_id: user.id,
        content: 'Post in forum 2',
        parent_post_id: null
      })
      .execute();

    const result1 = await getDiscussionPosts(forum1.id);
    const result2 = await getDiscussionPosts(forum2.id);

    expect(result1).toHaveLength(1);
    expect(result1[0].content).toEqual('Post in forum 1');
    expect(result1[0].forum_id).toEqual(forum1.id);

    expect(result2).toHaveLength(1);
    expect(result2[0].content).toEqual('Post in forum 2');
    expect(result2[0].forum_id).toEqual(forum2.id);
  });
});
