
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, coursesTable, missionsTable, quizzesTable, quizQuestionsTable, quizSubmissionsTable, studentProgressTable } from '../db/schema';
import { type SubmitQuizInput } from '../schema';
import { submitQuiz } from '../handlers/submit_quiz';
import { eq, and } from 'drizzle-orm';

describe('submitQuiz', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let studentId: number;
  let lecturerId: number;
  let courseId: number;
  let missionId: number;
  let quizId: number;
  let question1Id: number;
  let question2Id: number;

  beforeEach(async () => {
    // Create lecturer
    const lecturer = await db.insert(usersTable)
      .values({
        username: 'lecturer1',
        email: 'lecturer@test.com',
        password_hash: 'hash123',
        full_name: 'Test Lecturer',
        role: 'lecturer'
      })
      .returning()
      .execute();
    lecturerId = lecturer[0].id;

    // Create student
    const student = await db.insert(usersTable)
      .values({
        username: 'student1',
        email: 'student@test.com',
        password_hash: 'hash123',
        full_name: 'Test Student',
        role: 'student'
      })
      .returning()
      .execute();
    studentId = student[0].id;

    // Create course
    const course = await db.insert(coursesTable)
      .values({
        name: 'Test Course',
        description: 'Test course description',
        lecturer_id: lecturerId
      })
      .returning()
      .execute();
    courseId = course[0].id;

    // Create mission
    const mission = await db.insert(missionsTable)
      .values({
        course_id: courseId,
        title: 'Test Mission',
        description: 'Test mission description',
        meeting_number: 1,
        points_reward: 100,
        is_active: true
      })
      .returning()
      .execute();
    missionId = mission[0].id;

    // Create quiz
    const quiz = await db.insert(quizzesTable)
      .values({
        mission_id: missionId,
        title: 'Test Quiz',
        description: 'Test quiz description',
        points_reward: 50,
        time_limit_minutes: 30,
        is_active: true
      })
      .returning()
      .execute();
    quizId = quiz[0].id;

    // Create quiz questions
    const question1 = await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quizId,
        question_text: 'What is 2 + 2?',
        question_type: 'multiple_choice',
        options: JSON.stringify(['3', '4', '5', '6']),
        correct_answer: '4',
        points: 5,
        order_index: 1
      })
      .returning()
      .execute();
    question1Id = question1[0].id;

    const question2 = await db.insert(quizQuestionsTable)
      .values({
        quiz_id: quizId,
        question_text: 'Is the sky blue?',
        question_type: 'true_false',
        options: JSON.stringify(['true', 'false']),
        correct_answer: 'true',
        points: 3,
        order_index: 2
      })
      .returning()
      .execute();
    question2Id = question2[0].id;
  });

  it('should submit quiz with correct answers', async () => {
    const input: SubmitQuizInput = {
      quiz_id: quizId,
      student_id: studentId,
      answers: {
        [question1Id.toString()]: '4',
        [question2Id.toString()]: 'true'
      }
    };

    const result = await submitQuiz(input);

    expect(result.id).toBeDefined();
    expect(result.quiz_id).toEqual(quizId);
    expect(result.student_id).toEqual(studentId);
    expect(result.answers).toEqual(JSON.stringify(input.answers));
    expect(result.score).toEqual(100); // 2/2 correct = 100%
    expect(result.points_earned).toEqual(8); // 5 + 3 points
    expect(result.submitted_at).toBeInstanceOf(Date);
  });

  it('should submit quiz with partial correct answers', async () => {
    const input: SubmitQuizInput = {
      quiz_id: quizId,
      student_id: studentId,
      answers: {
        [question1Id.toString()]: '4',
        [question2Id.toString()]: 'false'
      }
    };

    const result = await submitQuiz(input);

    expect(result.score).toEqual(50); // 1/2 correct = 50%
    expect(result.points_earned).toEqual(5); // Only question 1 correct
  });

  it('should submit quiz with no correct answers', async () => {
    const input: SubmitQuizInput = {
      quiz_id: quizId,
      student_id: studentId,
      answers: {
        [question1Id.toString()]: '3',
        [question2Id.toString()]: 'false'
      }
    };

    const result = await submitQuiz(input);

    expect(result.score).toEqual(0);
    expect(result.points_earned).toEqual(0);
  });

  it('should save submission to database', async () => {
    const input: SubmitQuizInput = {
      quiz_id: quizId,
      student_id: studentId,
      answers: {
        [question1Id.toString()]: '4',
        [question2Id.toString()]: 'true'
      }
    };

    const result = await submitQuiz(input);

    const submissions = await db.select()
      .from(quizSubmissionsTable)
      .where(eq(quizSubmissionsTable.id, result.id))
      .execute();

    expect(submissions).toHaveLength(1);
    expect(submissions[0].quiz_id).toEqual(quizId);
    expect(submissions[0].student_id).toEqual(studentId);
    expect(submissions[0].score).toEqual(100);
    expect(submissions[0].points_earned).toEqual(8);
  });

  it('should handle case-insensitive answer matching', async () => {
    const input: SubmitQuizInput = {
      quiz_id: quizId,
      student_id: studentId,
      answers: {
        [question1Id.toString()]: '  4  ', // Extra spaces
        [question2Id.toString()]: 'TRUE' // Different case
      }
    };

    const result = await submitQuiz(input);

    expect(result.score).toEqual(100);
    expect(result.points_earned).toEqual(8);
  });

  it('should update student progress when existing progress exists', async () => {
    // Create initial progress
    await db.insert(studentProgressTable)
      .values({
        student_id: studentId,
        course_id: missionId, // Using mission_id as course reference
        total_points: 20,
        current_level: 1,
        missions_completed: 0
      })
      .execute();

    const input: SubmitQuizInput = {
      quiz_id: quizId,
      student_id: studentId,
      answers: {
        [question1Id.toString()]: '4',
        [question2Id.toString()]: 'true'
      }
    };

    await submitQuiz(input);

    const progress = await db.select()
      .from(studentProgressTable)
      .where(and(
        eq(studentProgressTable.student_id, studentId),
        eq(studentProgressTable.course_id, missionId)
      ))
      .execute();

    expect(progress).toHaveLength(1);
    expect(progress[0].total_points).toEqual(28); // 20 + 8
    expect(progress[0].last_activity).toBeInstanceOf(Date);
    expect(progress[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for inactive quiz', async () => {
    // Make quiz inactive
    await db.update(quizzesTable)
      .set({ is_active: false })
      .where(eq(quizzesTable.id, quizId))
      .execute();

    const input: SubmitQuizInput = {
      quiz_id: quizId,
      student_id: studentId,
      answers: {
        [question1Id.toString()]: '4'
      }
    };

    expect(submitQuiz(input)).rejects.toThrow(/quiz not found or inactive/i);
  });

  it('should throw error for non-existent quiz', async () => {
    const input: SubmitQuizInput = {
      quiz_id: 999999,
      student_id: studentId,
      answers: {
        '1': '4'
      }
    };

    expect(submitQuiz(input)).rejects.toThrow(/quiz not found or inactive/i);
  });

  it('should throw error for quiz with no questions', async () => {
    // Delete all questions
    await db.delete(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, quizId))
      .execute();

    const input: SubmitQuizInput = {
      quiz_id: quizId,
      student_id: studentId,
      answers: {}
    };

    expect(submitQuiz(input)).rejects.toThrow(/no questions found for quiz/i);
  });
});
