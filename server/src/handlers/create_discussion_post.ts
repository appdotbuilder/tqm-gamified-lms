
import { db } from '../db';
import { discussionPostsTable, discussionForumsTable, usersTable } from '../db/schema';
import { type CreateDiscussionPostInput, type DiscussionPost } from '../schema';
import { eq } from 'drizzle-orm';

export const createDiscussionPost = async (input: CreateDiscussionPostInput): Promise<DiscussionPost> => {
  try {
    // Verify forum exists
    const forum = await db.select()
      .from(discussionForumsTable)
      .where(eq(discussionForumsTable.id, input.forum_id))
      .execute();

    if (forum.length === 0) {
      throw new Error('Forum not found');
    }

    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // If parent_post_id is provided, verify it exists and belongs to the same forum
    if (input.parent_post_id) {
      const parentPost = await db.select()
        .from(discussionPostsTable)
        .where(eq(discussionPostsTable.id, input.parent_post_id))
        .execute();

      if (parentPost.length === 0) {
        throw new Error('Parent post not found');
      }

      if (parentPost[0].forum_id !== input.forum_id) {
        throw new Error('Parent post must belong to the same forum');
      }
    }

    // Insert the discussion post
    const result = await db.insert(discussionPostsTable)
      .values({
        forum_id: input.forum_id,
        user_id: input.user_id,
        content: input.content,
        parent_post_id: input.parent_post_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Discussion post creation failed:', error);
    throw error;
  }
};
