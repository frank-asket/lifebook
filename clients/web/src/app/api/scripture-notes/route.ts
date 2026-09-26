import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../../lib/firebase-admin.ts';
import {
  createScriptureNote,
  getUserScriptureNotes,
} from '../../../db/queries.ts';

async function resolveAuthenticatedUser(req: NextRequest, fallbackUid?: string, fallbackEmail?: string, fallbackName?: string) {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    if (token && token !== 'null' && token !== 'undefined') {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        return {
          uid: decoded.uid,
          email: decoded.email || fallbackEmail || 'pilgrim@lifebook.sanctuary',
          name: decoded.name || fallbackName || 'Sanctuary Pilgrim',
        };
      } catch (err) {
        console.error('Firebase token verification notice:', err);
      }
    }
  }
  if (fallbackUid) {
    return {
      uid: fallbackUid,
      email: fallbackEmail || 'pilgrim@lifebook.sanctuary',
      name: fallbackName || 'Sanctuary Pilgrim',
    };
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fallbackUid = searchParams.get('userUid') || undefined;
    const resolvedUser = await resolveAuthenticatedUser(req, fallbackUid);
    if (!resolvedUser) {
      return NextResponse.json({ notes: [] });
    }
    const notes = await getUserScriptureNotes(resolvedUser.uid);
    return NextResponse.json({ notes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load Scripture margin notes';
    return NextResponse.json({ error: message, notes: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resolvedUser = await resolveAuthenticatedUser(req, body.userUid, body.email, body.authorName);
    if (!resolvedUser) {
      return NextResponse.json({ error: 'Unauthorized: Please sign in to save Scripture study notes.' }, { status: 401 });
    }

    const { verseRef, translation, verseText, marginNote, sourceContext, saveToJournal } = body;
    if (!verseRef || !marginNote?.trim()) {
      return NextResponse.json({ error: 'Verse reference and margin note are required.' }, { status: 400 });
    }

    const note = await createScriptureNote({
      userUid: resolvedUser.uid,
      email: resolvedUser.email,
      authorName: resolvedUser.name,
      verseRef,
      translation: translation || 'ESV',
      verseText: verseText || '',
      marginNote: marginNote.trim(),
      sourceContext,
      saveToJournal: Boolean(saveToJournal),
    });

    return NextResponse.json({ note });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save Scripture margin note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
