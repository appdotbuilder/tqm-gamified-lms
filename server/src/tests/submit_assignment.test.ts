
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, missionsTable, assignmentsTable, assignmentSubmissionsTable } from '../db/schema';
import { type SubmitAssignmentInput } from '../schema';
import { submitAssignment } from '../handlers/submit_assignment';
import { eq, and } from 'drizzle-orm';

describe('submitAssignment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let studentId: number;
  let lecturerId: number;
  let courseId: number;
  let missionId: number;
  let assignmentId: number;

  beforeEach(async () => {
    // Create test lecturer
    const lecturerResult = await db.insert(usersTable)
      .values({
        username: 'testlecturer',
        email: 'lecturer@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();
    lecturerId = lecturerResult[0].id;

    // Create test student
    const studentResult = await db.insert(usersTable)
      .values({
        username: 'teststudent',
        email: 'student@test.com',
        password_hash: 'hashedpassword',
        full_name: 'Test Student',
        role: 'student'
      })
      .returning()
      .execute();
    studentId = studentResult[0].id;

    // Create test course
    const courseResult = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'A course for testing',
        lecturer_id: lecturerId
      })
      .returning()
      .execute();
    courseId = courseResult[0].id;

    // Create test mission
    const missionResult = await db.insert(missionsTable)
      .values({
        course_id: courseId,
        title: 'Test Mission',
        description: 'A mission for testing',
        meeting_number: 1,
        points_reward: 100,
        is_active: true
      })
      .returning()
      .execute();
    missionId = missionResult[0].id;

    // Create test assignment
    const assignmentResult = await db.insert(assignmentsTable)
      .values({
        mission_id: missionId,
        title: 'Test Assignment',
        description: 'An assignment for testing',
        points_reward: 50,
        due_date: new Date('2024-12-31'),
        is_active: true
      })
      .returning()
      .execute();
    assignmentId = assignmentResult[0].id;
  });

  it('should submit assignment with content', async () => {
    const input: SubmitAssignmentInput = {
      assignment_id: assignmentId,
      student_id: studentId,
      content: 'This is my assignment submission content',
      file_url: null
    };

    const result = await submitAssignment(input);

    expect(result.id).toBeDefined();
    expect(result.assignment_id).toEqual(assignmentId);
    expect(result.student_id).toEqual(studentId);
    expect(result.content).toEqual('This is my assignment submission content');
    expect(result.file_url).toBeNull();
    expect(result.score).toBeNull();
    expect(result.points_earned).toBeNull();
    expect(result.feedback).toBeNull();
    expect(result.submitted_at).toBeInstanceOf(Date);
    expect(result.graded_at).toBeNull();
  });

  it('should submit assignment with file URL', async () => {
    const input: SubmitAssignmentInput = {
      assignment_id: assignmentId,
      student_id: studentId,
      content: null,
      file_url: 'https://example.com/assignment.pdf'
    };

    const result = await submitAssignment(input);

    expect(result.assignment_id).toEqual(assignmentId);
    expect(result.student_id).toEqual(studentId);
    expect(result.content).toBeNull();
    expect(result.file_url).toEqual('https://example.com/assignment.pdf');
    expect(result.submitted_at).toBeInstanceOf(Date);
  });

  it('should submit assignment with both content and file URL', async () => {
    const input: SubmitAssignmentInput = {
      assignment_id: assignmentId,
      student_id: studentId,
      content: 'Assignment content',
      file_url: 'https://example.com/assignment.pdf'
    };

    const result = await submitAssignment(input);

    expect(result.content).toEqual('Assignment content');
    expect(result.file_url).toEqual('https://example.com/assignment.pdf');
  });

  it('should save submission to database', async () => {
    const input: SubmitAssignmentInput = {
      assignment_id: assignmentId,
      student_id: studentId,
      content: 'Test submission content',
      file_url: null
    };

    const result = await submitAssignment(input);

    const submissions = await db.select()
      .from(assignmentSubmissionsTable)
      .where(eq(assignmentSubmissionsTable.id, result.id))
      .execute();

    expect(submissions).toHaveLength(1);
    expect(submissions[0].assignment_id).toEqual(assignmentId);
    expect(submissions[0].student_id).toEqual(studentId);
    expect(submissions[0].content).toEqual('Test submission content');
    expect(submissions[0].submitted_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent assignment', async () => {
    const input: SubmitAssignmentInput = {
      assignment_id: 99999,
      student_id: studentId,
      content: 'Test content',
      file_url: null
    };

    await expect(submitAssignment(input)).rejects.toThrow(/assignment not found/i);
  });

  it('should throw error for non-existent student', async () => {
    const input: SubmitAssignmentInput = {
      assignment_id: assignmentId,
      student_id: 99999,
      content: 'Test content',
      file_url: null
    };

    await expect(submitAssignment(input)).rejects.toThrow(/student not found/i);
  });

  it('should throw error for inactive assignment', async () => {
    // Create inactive assignment
    const inactiveAssignmentResult = await db.insert(assignmentsTable)
      .values({
        mission_id: missionId,
        title: 'Inactive Assignment',
        description: 'An inactive assignment',
        points_reward: 30,
        due_date: new Date('2024-12-31'),
        is_active: false
      })
      .returning()
      .execute();

    const input: SubmitAssignmentInput = {
      assignment_id: inactiveAssignmentResult[0].id,
      student_id: studentId,
      content: 'Test content',
      file_url: null
    };

    await expect(submitAssignment(input)).rejects.toThrow(/assignment is not active/i);
  });

  it('should throw error for non-student user', async () => {
    const input: SubmitAssignmentInput = {
      assignment_id: assignmentId,
      student_id: lecturerId, // Using lecturer ID instead of student ID
      content: 'Test content',
      file_url: null
    };

    await expect(submitAssignment(input)).rejects.toThrow(/student not found/i);
  });

  it('should throw error when assignment already submitted', async () => {
    const input: SubmitAssignmentInput = {
      assignment_id: assignmentId,
      student_id: studentId,
      content: 'First submission',
      file_url: null
    };

    // Submit first time
    await submitAssignment(input);

    // Try to submit again
    const duplicateInput: SubmitAssignmentInput = {
      assignment_id: assignmentId,
      student_id: studentId,
      content: 'Second submission',
      file_url: null
    };

    await expect(submitAssignment(duplicateInput)).rejects.toThrow(/assignment already submitted/i);
  });

  it('should throw error when neither content nor file_url provided', async () => {
    const input: SubmitAssignmentInput = {
      assignment_id: assignmentId,
      student_id: studentId,
      content: null,
      file_url: null
    };

    await expect(submitAssignment(input)).rejects.toThrow(/either content or file_url must be provided/i);
  });
});
