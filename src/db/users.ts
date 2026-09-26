import { db } from './index.ts';
import { users } from './schema.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  fullName?: string,
  faithSeason?: string,
  translation?: string,
  dailyQuietTime?: string
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        fullName: fullName || email.split('@')[0],
        faithSeason: faithSeason || 'Daily Abiding in Scripture & Prayer (Psalm 119:105)',
        translation: translation || 'ESV',
        dailyQuietTime: dailyQuietTime || 'Morning 7:00 AM',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(fullName ? { fullName } : {}),
          ...(faithSeason ? { faithSeason } : {}),
          ...(translation ? { translation } : {}),
          ...(dailyQuietTime ? { dailyQuietTime } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user profile. Please try again later.', { cause: error });
  }
}
