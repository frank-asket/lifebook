import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../../../lib/firebase-admin.ts';
import {
  createCommunityPrayer,
  getCommunityPrayers,
  incrementCommunityPrayerCount,
} from '../../../db/queries.ts';

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
    const season = searchParams.get('season') || 'All';
    const prayers = await getCommunityPrayers(season);
    return NextResponse.json({ prayers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load community prayers';
    return NextResponse.json({ error: message, prayers: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resolvedUser = await resolveAuthenticatedUser(req, body);
    if (!resolvedUser) {
      return NextResponse.json({ error: 'Unauthorized: Please sign in to share in the Fellowship Sanctuary.' }, { status: 401 });
    }

    const { lifeSeason, content, scriptureAnchor, isTestimony } = body;
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Prayer or testimony content is required.' }, { status: 400 });
    }

    const created = await createCommunityPrayer({
      userUid: resolvedUser.uid,
      email: resolvedUser.email,
      authorName: body.authorName?.trim() || resolvedUser.name,
      lifeSeason: lifeSeason || 'Peace',
      content: content.trim(),
      scriptureAnchor: scriptureAnchor?.trim() || undefined,
      isTestimony: Boolean(isTestimony),
    });

    return NextResponse.json({ prayer: created });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to post community prayer';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const prayerId = Number(body.id);
    if (!prayerId) {
      return NextResponse.json({ error: 'Valid prayer ID required.' }, { status: 400 });
    }
    const updated = await incrementCommunityPrayerCount(prayerId);
    return NextResponse.json({ prayer: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update praying count';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
