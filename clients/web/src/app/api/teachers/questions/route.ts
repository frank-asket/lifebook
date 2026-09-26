import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../../../lib/firebase-admin.ts';
import {
  createTeacherQuestion,
  getTeacherQuestionsBySlug,
  incrementTeacherQuestionAmen,
} from '../../../../db/queries.ts';

async function resolveAuthenticatedUser(req: NextRequest, fallbackBody?: { userUid?: string; email?: string; authorName?: string }) {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    if (token && token !== 'null' && token !== 'undefined') {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        return {
          uid: decoded.uid,
          email: decoded.email || fallbackBody?.email || 'pilgrim@lifebook.sanctuary',
          name: decoded.name || fallbackBody?.authorName || 'Sanctuary Pilgrim',
        };
      } catch (err) {
        console.error('Firebase token verification notice:', err);
      }
    }
  }
  if (fallbackBody?.userUid) {
    return {
      uid: fallbackBody.userUid,
      email: fallbackBody.email || 'pilgrim@lifebook.sanctuary',
      name: fallbackBody.authorName || 'Sanctuary Pilgrim',
    };
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherSlug = searchParams.get('teacherSlug') || 'pastor-david-vance';
    const questions = await getTeacherQuestionsBySlug(teacherSlug);
    return NextResponse.json({ questions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch pastoral questions';
    return NextResponse.json({ error: message, questions: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resolvedUser = await resolveAuthenticatedUser(req, body);
    if (!resolvedUser) {
      return NextResponse.json({ error: 'Unauthorized: Please sign in to submit a pastoral request.' }, { status: 401 });
    }

    const { teacherSlug, requestType, content, pastoralReply } = body;
    if (!teacherSlug || !content?.trim()) {
      return NextResponse.json({ error: 'Teacher slug and question content are required.' }, { status: 400 });
    }

    const created = await createTeacherQuestion({
      teacherSlug,
      userUid: resolvedUser.uid,
      email: resolvedUser.email,
      authorName: body.authorName?.trim() || resolvedUser.name,
      requestType: requestType === 'prayer' ? 'prayer' : 'question',
      content: content.trim(),
      pastoralReply,
    });

    return NextResponse.json({ question: created });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create pastoral question';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const questionId = Number(body.id);
    if (!questionId) {
      return NextResponse.json({ error: 'Valid question ID required.' }, { status: 400 });
    }
    const updated = await incrementTeacherQuestionAmen(questionId);
    return NextResponse.json({ question: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update prayer count';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
