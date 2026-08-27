import { describe, expect, it } from 'vitest'
import { cn, initials } from './utils'

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts (last wins)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-sm', undefined, false, 'font-medium')).toBe('text-sm font-medium')
  })
})

describe('initials', () => {
  it('returns up to two uppercase initials', () => {
    expect(initials('Alex Morgan')).toBe('AM')
    expect(initials('sarah chen')).toBe('SC')
  })

  it('handles a single name', () => {
    expect(initials('Cher')).toBe('C')
  })

  it('handles extra whitespace', () => {
    expect(initials('  David   Wilson  ')).toBe('DW')
  })
})
