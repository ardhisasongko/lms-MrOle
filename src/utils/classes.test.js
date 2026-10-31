import { describe, expect, it } from 'vitest';
import {
  JOIN_CODE_ALPHABET,
  generateJoinCode,
  getAssignmentStatus,
  isValidJoinCode,
  normalizeJoinCode,
} from './classes';

describe('generateJoinCode', () => {
  it('always produces 6 characters from the unambiguous alphabet', () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generateJoinCode();
      expect(code).toHaveLength(6);
      expect([...code].every((ch) => JOIN_CODE_ALPHABET.includes(ch))).toBe(true);
    }
  });

  it('is deterministic for a stubbed random source', () => {
    expect(generateJoinCode(() => 0)).toBe('AAAAAA');
    expect(generateJoinCode(() => 0.999999)).toBe('999999');
  });

  it('never emits ambiguous characters 0, O, 1, I, L', () => {
    expect(JOIN_CODE_ALPHABET).not.toMatch(/[0O1IL]/);
  });
});

describe('normalizeJoinCode / isValidJoinCode', () => {
  it('uppercases, strips separators and spaces, and truncates to 6', () => {
    expect(normalizeJoinCode(' ab-cd 23 ')).toBe('ABCD23');
    expect(normalizeJoinCode('abcd2345')).toBe('ABCD23');
    expect(normalizeJoinCode(null)).toBe('');
  });

  it('accepts valid codes regardless of input casing/spacing', () => {
    expect(isValidJoinCode('k7x2pd')).toBe(true);
    expect(isValidJoinCode(' K7-X2PD ')).toBe(true);
  });

  it('rejects short codes and codes with ambiguous characters', () => {
    expect(isValidJoinCode('K7X2')).toBe(false);
    expect(isValidJoinCode('K7X2PO')).toBe(false); // contains O
    expect(isValidJoinCode('K7X2P1')).toBe(false); // contains 1
    expect(isValidJoinCode('')).toBe(false);
  });
});

describe('getAssignmentStatus', () => {
  const NOW = new Date('2026-08-10T10:00:00.000Z');

  it('is active when there is no due date', () => {
    expect(getAssignmentStatus({ dueAt: null }, NOW)).toBe('active');
    expect(getAssignmentStatus({}, NOW)).toBe('active');
  });

  it('is active before the deadline and overdue after it', () => {
    expect(getAssignmentStatus({ dueAt: '2026-08-11T10:00:00.000Z' }, NOW)).toBe('active');
    expect(getAssignmentStatus({ dueAt: '2026-08-09T10:00:00.000Z' }, NOW)).toBe('overdue');
  });

  it('completed wins over overdue', () => {
    expect(getAssignmentStatus({ dueAt: '2026-08-09T10:00:00.000Z' }, NOW, true)).toBe('completed');
  });

  it('ignores an unparseable due date', () => {
    expect(getAssignmentStatus({ dueAt: 'bukan-tanggal' }, NOW)).toBe('active');
  });
});
