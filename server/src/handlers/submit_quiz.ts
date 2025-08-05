
import { db } from '../db';
import { quizzesTable, quizQuestionsTable, quizSubmissionsTable, studentProgressTable } from '../db/schema';
import { type SubmitQuizInput, type QuizSubmission } from '../schema';
import { eq, and } from 'drizzle-orm';

export const submitQuiz = async (input: SubmitQuizInput): Promise<QuizSubmission> => {
  try {
    // Verify quiz exists and is active
    const quiz = await db.select()
      .from(quizzesTable)
      .where(and(
        eq(quizzesTable.id, input.quiz_id),
        eq(quizzesTable.is_active, true)
      ))
      .execute();

    if (quiz.length === 0) {
      throw new Error('Quiz not found or inactive');
    }

    // Get quiz questions
    const questions = await db.select()
      .from(quizQuestionsTable)
      .where(eq(quizQuestionsTable.quiz_id, input.quiz_id))
      .execute();

    if (questions.length === 0) {
      throw new Error('No questions found for quiz');
    }

    // Calculate score and points
    let correctAnswers = 0;
    let totalPoints = 0;

    questions.forEach(question => {
      const studentAnswer = input.answers[question.id.toString()];
      if (studentAnswer && studentAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim()) {
        correctAnswers++;
        totalPoints += question.points;
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);
    const pointsEarned = totalPoints;

    // Insert quiz submission
    const submissionResult = await db.insert(quizSubmissionsTable)
      .values({
        quiz_id: input.quiz_id,
        student_id: input.student_id,
        answers: JSON.stringify(input.answers),
        score: score,
        points_earned: pointsEarned
      })
      .returning()
      .execute();

    // Update student progress
    const existingProgress = await db.select()
      .from(studentProgressTable)
      .where(and(
        eq(studentProgressTable.student_id, input.student_id),
        eq(studentProgressTable.course_id, quiz[0].mission_id) // Using mission_id as course reference
      ))
      .execute();

    if (existingProgress.length > 0) {
      // Update existing progress
      await db.update(studentProgressTable)
        .set({
          total_points: existingProgress[0].total_points + pointsEarned,
          last_activity: new Date(),
          updated_at: new Date()
        })
        .where(eq(studentProgressTable.id, existingProgress[0].id))
        .execute();
    }

    return submissionResult[0];
  } catch (error) {
    console.error('Quiz submission failed:', error);
    throw error;
  }
};
