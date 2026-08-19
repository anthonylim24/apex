import { COACH_NOTES, coachNoteForDate, greetingForHour, restEncouragement } from '../coachVoice';

describe('coach voice', () => {
  it('rotates the daily note deterministically', () => {
    const a = coachNoteForDate(new Date('2026-08-19T10:00:00Z'));
    const b = coachNoteForDate(new Date('2026-08-19T23:00:00Z'));
    const c = coachNoteForDate(new Date('2026-08-20T01:00:00Z'));
    expect(a).toBe(b); // same day, same note
    expect(c).not.toBe(a); // next day rotates
    expect(COACH_NOTES).toContain(a);
  });

  it('cycles rest encouragement by completed sets, never randomly', () => {
    expect(restEncouragement(0)).toBe(restEncouragement(5));
    expect(restEncouragement(1)).not.toBe(restEncouragement(2));
  });

  it('greets by time of day', () => {
    expect(greetingForHour(7)).toMatch(/morning/i);
    expect(greetingForHour(14)).toMatch(/ready to train/i);
    expect(greetingForHour(19)).toMatch(/evening/i);
    expect(greetingForHour(23)).toMatch(/late/i);
  });
});
