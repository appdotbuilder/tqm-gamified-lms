
import { db } from '../db';
import { assignmentSubmissionsTable, assignmentsTable, usersTable } from '../db/schema';
import { type SubmitAssignmentInput, type AssignmentSubmission } from '../schema';
import { eq, and } from 'drizzle-orm';

export const submitAssignment = async (input: SubmitAssignmentInput): Promise<AssignmentSubmission> => {
  try {
    // Verify assignment exists and is active
    const assignment = await db.select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.id, input.assignment_id))
      .execute();

    if (assignment.length === 0) {
      throw new Error('Assignment not found');
    }

    if (!assignment[0].is_active) {
      throw new Error('Assignment is not active');
    }

    // Verify student exists and has student role
    const student = await db.select()
      .from(usersTable)
      .where(
        and(
          eq(usersTable.id, input.student_id),
          eq(usersTable.role, 'student')
        )
      )
      .execute();

    if (student.length === 0) {
      throw new Error('Student not found');
    }

    // Check if student has already submitted this assignment
    const existingSubmission = await db.select()
      .from(assignmentSubmissionsTable)
      .where(
        and(
          eq(assignmentSubmissionsTable.assignment_id, input.assignment_id),
          eq(assignmentSubmissionsTable.student_id, input.student_id)
        )
      )
      .execute();

    if (existingSubmission.length > 0) {
      throw new Error('Assignment already submitted');
    }

    // Validate that at least one of content or file_url is provided
    if (!input.content && !input.file_url) {
      throw new Error('Either content or file_url must be provided');
    }

    // Insert assignment submission
    const result = await db.insert(assignmentSubmissionsTable)
      .values({
        assignment_id: input.assignment_id,
        student_id: input.student_id,
        content: input.content,
        file_url: input.file_url,
        score: null,
        points_earned: null,
        feedback: null,
        graded_at: null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Assignment submission failed:', error);
    throw error;
  }
};
