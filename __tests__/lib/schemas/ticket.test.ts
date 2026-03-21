import { describe, it, expect } from 'vitest'
import { ticketSchema, commentSchema, updateStatusSchema } from '@/lib/schemas/ticket'

describe('ticketSchema', () => {
  it('accepts valid data', () => {
    const r = ticketSchema.safeParse({ title: 'Heizung defekt', description: 'Seit gestern kalt.', propertyId: 'prop-1', unitId: 'unit-1', priority: 'HIGH' })
    expect(r.success).toBe(true)
  })
  it('rejects empty title', () => {
    const r = ticketSchema.safeParse({ title: '', description: 'Test', propertyId: 'prop-1' })
    expect(r.success).toBe(false)
  })
  it('accepts without unitId', () => {
    const r = ticketSchema.safeParse({ title: 'Riss im Treppenhaus', description: 'Kleiner Riss.', propertyId: 'prop-1' })
    expect(r.success).toBe(true)
  })
})

describe('commentSchema', () => {
  it('accepts valid comment', () => {
    const r = commentSchema.safeParse({ text: 'Techniker kommt morgen.' })
    expect(r.success).toBe(true)
  })
  it('rejects empty text', () => {
    const r = commentSchema.safeParse({ text: '' })
    expect(r.success).toBe(false)
  })
})

describe('updateStatusSchema', () => {
  it('accepts valid status', () => {
    const r = updateStatusSchema.safeParse({ status: 'IN_PROGRESS' })
    expect(r.success).toBe(true)
  })
  it('rejects invalid status', () => {
    const r = updateStatusSchema.safeParse({ status: 'INVALID' })
    expect(r.success).toBe(false)
  })
})
