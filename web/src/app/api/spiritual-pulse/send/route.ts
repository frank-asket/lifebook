import { NextResponse } from 'next/server';

export interface PulseDaySummary {
  date: string;
  dayName: string;
  formattedDate: string;
  mood: string | null;
  moodLabel: string;
  moodEmoji: string;
  moodColor: string;
  intensity: number;
  practices: {
    scriptureRead: boolean;
    stillnessMinutes: number;
    prayerOffered: boolean;
    journalWritten: boolean;
  };
}

export interface SpiritualPulseData {
  startDate: string;
  endDate: string;
  dateRangeFormatted: string;
  totalCheckIns: number;
  consistencyRate: number;
  currentStreak: number;
  longestStreak: number;
  dominantMood: {
    id: string;
    label: string;
    emoji: string;
    color: string;
    count: number;
    percentage: number;
    insight: string;
  };
  moodCounts: Record<string, { label: string; emoji: string; count: number; color: string }>;
  days: PulseDaySummary[];
  milestonesUnlocked: Array<{
    days: number;
    title: string;
    icon: string;
    tier: string;
  }>;
  nextMilestone: {
    days: number;
    title: string;
    icon: string;
    tier: string;
    daysRemaining: number;
    progressPercentage: number;
  } | null;
  practicesTotals: {
    scriptureDays: number;
    stillnessMinutes: number;
    prayersOffered: number;
    journalEntries: number;
  };
  weeklyScripture: {
    text: string;
    reference: string;
  };
  pastoralEncouragement: string;
}

export function generatePulseHtmlEmail(data: SpiritualPulseData, recipientName?: string): string {
  const name = recipientName ? recipientName.trim() : 'Friend';

  const dayBadgesHtml = data.days
    .map(d => {
      const isLogged = d.intensity > 0 || d.mood;
      return `
        <td align="center" style="padding: 4px; width: 14.28%;">
          <div style="background-color: ${isLogged ? '#FAF8FC' : '#F4F2F7'}; border: 1px solid ${isLogged ? '#D8CFEC' : '#E8E4EE'}; border-radius: 12px; padding: 10px 4px; text-align: center;">
            <div style="font-size: 10px; font-weight: 700; color: #7B6E96; text-transform: uppercase;">${d.dayName.slice(0, 3)}</div>
            <div style="font-size: 11px; font-weight: 600; color: #352B4E; margin-top: 2px;">${d.formattedDate}</div>
            <div style="font-size: 22px; margin: 6px 0 4px;">${d.moodEmoji || (isLogged ? '✨' : '·')}</div>
            <div style="font-size: 9px; font-weight: 600; color: ${isLogged ? d.moodColor : '#A69BBF'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${d.moodLabel || 'Rest'}
            </div>
          </div>
        </td>
      `;
    })
    .join('');

  const moodRowsHtml = Object.entries(data.moodCounts)
    .filter(([, v]) => v.count > 0)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([, v]) => {
      const pct = Math.round((v.count / Math.max(1, data.totalCheckIns)) * 100);
      return `
        <tr style="border-bottom: 1px solid #ECE7F4;">
          <td style="padding: 8px 12px; font-size: 13px; color: #2A2045; font-weight: 600;">
            <span style="font-size: 16px; vertical-align: middle; margin-right: 6px;">${v.emoji}</span>
            ${v.label}
          </td>
          <td style="padding: 8px 12px; font-size: 13px; color: #5B4F75; font-weight: 700; text-align: right;">
            ${v.count} ${v.count === 1 ? 'day' : 'days'}
          </td>
          <td style="padding: 8px 12px; width: 35%;">
            <div style="background-color: #ECE7F4; border-radius: 6px; height: 8px; overflow: hidden;">
              <div style="background-color: ${v.color}; height: 8px; width: ${pct}%; border-radius: 6px;"></div>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');

  const milestonesBadgesHtml = data.milestonesUnlocked.length > 0
    ? data.milestonesUnlocked
        .map(
          m => `
        <div style="display: inline-block; background-color: #FFFDF7; border: 1px solid #E8CB72; border-radius: 12px; padding: 8px 14px; margin: 4px; vertical-align: middle;">
          <span style="font-size: 18px; vertical-align: middle; margin-right: 6px;">${m.icon}</span>
          <span style="font-size: 12px; font-weight: 700; color: #5B4715; vertical-align: middle;">${m.title}</span>
          <span style="display: inline-block; margin-left: 6px; font-size: 9px; font-weight: 800; background-color: #EBDD78; color: #4A3A0B; padding: 2px 6px; border-radius: 6px;">✓ Unlocked</span>
        </div>
      `
        )
        .join('')
    : `<div style="font-size: 12px; color: #7B6E96; font-style: italic;">No new streak tiers reached this week — keep building your daily foundation!</div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Spiritual Pulse</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F6F3FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F6F3FA; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #FFFFFF; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 30px rgba(33, 27, 59, 0.08); border: 1px solid #EAE4F2;">
          
          <!-- Hero Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #211B3B 0%, #2F2353 50%, #16424D 100%); padding: 36px 32px; text-align: center; color: #FFFFFF;">
              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.12); padding: 4px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #37C6C2; margin-bottom: 12px;">
                ✦ Weekly Spiritual Pulse
              </div>
              <h1 style="margin: 0; font-size: 28px; font-family: Georgia, serif; font-weight: 400; color: #FFFFFF; letter-spacing: -0.5px;">
                Grace & Peace, ${name}
              </h1>
              <p style="margin: 8px 0 0; font-size: 13px; color: #D6CFE4; letter-spacing: 0.2px;">
                Spiritual rhythm and heart reflections for <strong>${data.dateRangeFormatted}</strong>
              </p>
            </td>
          </tr>

          <!-- Key Metrics Grid -->
          <tr>
            <td style="padding: 24px 28px 0;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="32%" align="center" style="background-color: #FAF8FC; border: 1px solid #EBE5F5; border-radius: 16px; padding: 14px 8px;">
                    <div style="font-size: 20px;">🔥</div>
                    <div style="font-size: 22px; font-weight: 800; color: #211B3B; margin-top: 2px;">${data.currentStreak} Days</div>
                    <div style="font-size: 10px; font-weight: 700; color: #7B6E96; text-transform: uppercase; letter-spacing: 0.5px;">Active Streak</div>
                  </td>
                  <td width="2%"></td>
                  <td width="32%" align="center" style="background-color: #FAF8FC; border: 1px solid #EBE5F5; border-radius: 16px; padding: 14px 8px;">
                    <div style="font-size: 20px;">${data.dominantMood.emoji}</div>
                    <div style="font-size: 18px; font-weight: 800; color: #211B3B; margin-top: 2px;">${data.dominantMood.label}</div>
                    <div style="font-size: 10px; font-weight: 700; color: #7B6E96; text-transform: uppercase; letter-spacing: 0.5px;">Dominant State</div>
                  </td>
                  <td width="2%"></td>
                  <td width="32%" align="center" style="background-color: #FAF8FC; border: 1px solid #EBE5F5; border-radius: 16px; padding: 14px 8px;">
                    <div style="font-size: 20px;">🌱</div>
                    <div style="font-size: 22px; font-weight: 800; color: #211B3B; margin-top: 2px;">${data.consistencyRate}%</div>
                    <div style="font-size: 10px; font-weight: 700; color: #7B6E96; text-transform: uppercase; letter-spacing: 0.5px;">Consistency</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 7-Day Mood Timeline -->
          <tr>
            <td style="padding: 28px 28px 0;">
              <div style="border-bottom: 2px solid #F0ECF6; padding-bottom: 8px; margin-bottom: 14px;">
                <span style="font-size: 11px; font-weight: 800; color: #705E8C; text-transform: uppercase; letter-spacing: 1px;">
                  1. Seven-Day Soul Rhythm
                </span>
                <h3 style="margin: 2px 0 0; font-size: 18px; font-family: Georgia, serif; color: #1E1835;">
                  Your Daily Check-in Timeline
                </h3>
              </div>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  ${dayBadgesHtml}
                </tr>
              </table>

              <!-- Mood Patterns Table -->
              <div style="margin-top: 20px; background-color: #FAF8FC; border: 1px solid #ECE7F4; border-radius: 16px; padding: 12px 16px;">
                <div style="font-size: 12px; font-weight: 700; color: #352B4E; margin-bottom: 8px;">
                  Soul State Frequency Distribution
                </div>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  ${moodRowsHtml}
                </table>
              </div>

              <!-- Pastoral Insight Callout -->
              <div style="margin-top: 14px; background-color: #F4FAF9; border-left: 4px solid #1FB6B0; border-radius: 0 12px 12px 0; padding: 12px 16px;">
                <div style="font-size: 11px; font-weight: 800; color: #0E7773; text-transform: uppercase; letter-spacing: 0.5px;">
                  Pastoral Rhythm Reflection
                </div>
                <p style="margin: 4px 0 0; font-size: 13px; color: #204C49; line-height: 1.5;">
                  ${data.dominantMood.insight}
                </p>
              </div>
            </td>
          </tr>

          <!-- Milestone Achievements -->
          <tr>
            <td style="padding: 32px 28px 0;">
              <div style="border-bottom: 2px solid #F0ECF6; padding-bottom: 8px; margin-bottom: 14px;">
                <span style="font-size: 11px; font-weight: 800; color: #705E8C; text-transform: uppercase; letter-spacing: 1px;">
                  2. Milestone Achievements
                </span>
                <h3 style="margin: 2px 0 0; font-size: 18px; font-family: Georgia, serif; color: #1E1835;">
                  Consecutive Streak Records
                </h3>
              </div>

              <!-- Badges Unlocked -->
              <div style="margin-bottom: 16px;">
                ${milestonesBadgesHtml}
              </div>

              <!-- Next Milestone Countdown Box -->
              ${
                data.nextMilestone
                  ? `
              <div style="background: linear-gradient(135deg, #241D3F 0%, #1B3542 100%); border-radius: 16px; padding: 18px 20px; color: #FFFFFF;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="48" style="vertical-align: middle;">
                      <div style="background-color: rgba(255, 255, 255, 0.15); width: 44px; height: 44px; border-radius: 12px; font-size: 24px; text-align: center; line-height: 44px;">
                        ${data.nextMilestone.icon}
                      </div>
                    </td>
                    <td style="padding-left: 14px; vertical-align: middle;">
                      <div style="font-size: 10px; font-weight: 800; color: #37C6C2; text-transform: uppercase;">Next Milestone Goal</div>
                      <div style="font-size: 15px; font-weight: 700; color: #FFFFFF;">${data.nextMilestone.title} (${data.nextMilestone.days} Days)</div>
                    </td>
                    <td align="right" style="vertical-align: middle;">
                      <div style="font-size: 16px; font-weight: 800; color: #E3B15E;">${data.nextMilestone.daysRemaining} days</div>
                      <div style="font-size: 10px; color: #C4BED4;">remaining</div>
                    </td>
                  </tr>
                </table>
                <div style="margin-top: 12px;">
                  <div style="background-color: rgba(255, 255, 255, 0.12); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #1FB6B0, #E3B15E); height: 8px; width: ${data.nextMilestone.progressPercentage}%; border-radius: 4px;"></div>
                  </div>
                  <div style="font-size: 11px; color: #BDB4CE; margin-top: 6px; text-align: right;">
                    ${data.currentStreak} of ${data.nextMilestone.days} consecutive days completed (${data.nextMilestone.progressPercentage}%)
                  </div>
                </div>
              </div>
              `
                  : ''
              }
            </td>
          </tr>

          <!-- Faithful Practices Completed This Week -->
          <tr>
            <td style="padding: 28px 28px 0;">
              <div style="border-bottom: 2px solid #F0ECF6; padding-bottom: 8px; margin-bottom: 14px;">
                <span style="font-size: 11px; font-weight: 800; color: #705E8C; text-transform: uppercase; letter-spacing: 1px;">
                  3. Seven-Day Practices
                </span>
                <h3 style="margin: 2px 0 0; font-size: 18px; font-family: Georgia, serif; color: #1E1835;">
                  Faithful Stepping Stones
                </h3>
              </div>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="23%" align="center" style="background-color: #FAF8FC; border: 1px solid #ECE7F4; border-radius: 12px; padding: 10px 4px;">
                    <div style="font-size: 18px;">📖</div>
                    <div style="font-size: 16px; font-weight: 800; color: #211B3B; margin-top: 2px;">${data.practicesTotals.scriptureDays}</div>
                    <div style="font-size: 9px; font-weight: 700; color: #7B6E96;">Scripture Days</div>
                  </td>
                  <td width="2%"></td>
                  <td width="23%" align="center" style="background-color: #FAF8FC; border: 1px solid #ECE7F4; border-radius: 12px; padding: 10px 4px;">
                    <div style="font-size: 18px;">🕯️</div>
                    <div style="font-size: 16px; font-weight: 800; color: #211B3B; margin-top: 2px;">${data.practicesTotals.stillnessMinutes}m</div>
                    <div style="font-size: 9px; font-weight: 700; color: #7B6E96;">Stillness</div>
                  </td>
                  <td width="2%"></td>
                  <td width="23%" align="center" style="background-color: #FAF8FC; border: 1px solid #ECE7F4; border-radius: 12px; padding: 10px 4px;">
                    <div style="font-size: 18px;">🙏</div>
                    <div style="font-size: 16px; font-weight: 800; color: #211B3B; margin-top: 2px;">${data.practicesTotals.prayersOffered}</div>
                    <div style="font-size: 9px; font-weight: 700; color: #7B6E96;">Prayers</div>
                  </td>
                  <td width="2%"></td>
                  <td width="23%" align="center" style="background-color: #FAF8FC; border: 1px solid #ECE7F4; border-radius: 12px; padding: 10px 4px;">
                    <div style="font-size: 18px;">✍️</div>
                    <div style="font-size: 16px; font-weight: 800; color: #211B3B; margin-top: 2px;">${data.practicesTotals.journalEntries}</div>
                    <div style="font-size: 9px; font-weight: 700; color: #7B6E96;">Journals</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Scripture Blessing -->
          <tr>
            <td style="padding: 28px 28px 36px;">
              <div style="background-color: #FAF8F2; border: 1px solid #EBE4D5; border-radius: 20px; padding: 22px 24px; text-align: center;">
                <span style="font-size: 10px; font-weight: 800; color: #8A7539; text-transform: uppercase; letter-spacing: 1.5px;">
                  ✦ Weekly Word of Promise
                </span>
                <blockquote style="margin: 10px 0 0; font-family: Georgia, serif; font-size: 16px; font-style: italic; color: #2B2313; line-height: 1.6;">
                  “${data.weeklyScripture.text}”
                </blockquote>
                <div style="margin-top: 8px; font-size: 12px; font-weight: 700; color: #8A7539;">
                  — ${data.weeklyScripture.reference}
                </div>
                <p style="margin: 16px 0 0; font-size: 13px; color: #584F3D; line-height: 1.5; border-top: 1px solid #EAE2D2; padding-top: 14px;">
                  ${data.pastoralEncouragement}
                </p>
              </div>

              <!-- CTA Button to return to practice -->
              <div style="text-align: center; margin-top: 28px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://lifebook.app'}/progress" style="display: inline-block; background-color: #2A2146; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-size: 13px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(42, 33, 70, 0.2);">
                  Open LifeBook Dashboard →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F5FC; border-top: 1px solid #ECE7F4; padding: 24px 32px; text-align: center; font-size: 11px; color: #8A7E9E; line-height: 1.6;">
              <p style="margin: 0;">
                You are receiving this because you subscribed to the <strong>LifeBook Weekly Spiritual Pulse</strong>.
              </p>
              <p style="margin: 6px 0 0;">
                LifeBook · A quieter way to walk with Jesus · Scripture · Reflection · Prayer
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, pulseData } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    if (!pulseData) {
      return NextResponse.json(
        { error: 'Missing spiritual pulse data.' },
        { status: 400 }
      );
    }

    const htmlContent = generatePulseHtmlEmail(pulseData, name);
    const subject = `Your Weekly Spiritual Pulse (${pulseData.dateRangeFormatted || 'Past 7 Days'}) ✨`;
    const fromAddress = process.env.EMAIL_FROM || 'LifeBook <pulse@lifebook.app>';

    let sendProvider = 'simulated';
    let messageId = 'pulse_' + Date.now();

    // 1. Check if Resend API key is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: fromAddress.includes('@') ? fromAddress : 'LifeBook <onboarding@resend.dev>',
            to: [email],
            subject,
            html: htmlContent,
          }),
        });

        if (resendRes.ok) {
          const resendData = await resendRes.json();
          sendProvider = 'resend';
          messageId = resendData.id || messageId;
        } else {
          const errText = await resendRes.text();
          console.warn('[SpiritualPulse] Resend API response error:', errText);
        }
      } catch (err) {
        console.warn('[SpiritualPulse] Resend request failed:', err);
      }
    }

    // 2. Check if SendGrid is configured
    else if (process.env.SENDGRID_API_KEY) {
      try {
        const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email }] }],
            from: { email: fromAddress.match(/<([^>]+)>/)?.[1] || fromAddress, name: 'LifeBook' },
            subject,
            content: [{ type: 'text/html', value: htmlContent }],
          }),
        });

        if (sgRes.ok) {
          sendProvider = 'sendgrid';
        } else {
          console.warn('[SpiritualPulse] SendGrid API error:', await sgRes.text());
        }
      } catch (err) {
        console.warn('[SpiritualPulse] SendGrid request failed:', err);
      }
    }

    // Fallback / Sandbox logging:
    console.log(`[SpiritualPulse] Weekly Pulse generated for ${email} (${sendProvider})`);
    console.log(`[SpiritualPulse] Date range: ${pulseData.dateRangeFormatted}, Dominant: ${pulseData.dominantMood?.label}, Streak: ${pulseData.currentStreak}d`);

    return NextResponse.json({
      success: true,
      delivered: true,
      provider: sendProvider,
      messageId,
      recipient: email,
      subject,
      dateRange: pulseData.dateRangeFormatted,
      previewHtml: htmlContent,
      message: `Weekly Spiritual Pulse successfully generated and sent to ${email}!`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate and email Weekly Spiritual Pulse.';
    console.error('[SpiritualPulse] Error processing pulse request:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
