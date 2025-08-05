
import { db } from '../db';
import { discussionPostsTable, usersTable } from '../db/schema';
import { type DiscussionPost } from '../schema';
import { eq } from 'drizzle-orm';

export async function getDiscussionPosts(forumId: number): Promise<DiscussionPost[]> {
  try {
    // Fetch all posts for the forum with user information for proper ordering
    const results = await db.select({
      id: discussionPostsTable.id,
      forum_id: discussionPostsTable.forum_id,
      user_id: discussionPostsTable.user_id,
      content: discussionPostsTable.content,
      parent_post_id: discussionPostsTable.parent_post_id,
      created_at: discussionPostsTable.created_at,
      updated_at: discussionPostsTable.updated_at,
    })
    .from(discussionPostsTable)
    .innerJoin(usersTable, eq(discussionPostsTable.user_id, usersTable.id))
    .where(eq(discussionPostsTable.forum_id, forumId))
    .orderBy(discussionPostsTable.created_at)
    .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch discussion posts:', error);
    throw error;
  }
}
