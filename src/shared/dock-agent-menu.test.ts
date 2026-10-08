import { describe, expect, it } from 'vitest'
import { MAX_DOCK_AGENT_LABEL_LENGTH, readDockAgentMenuPayload } from './dock-agent-menu'

function entry(id: string, label = 'Agent') {
  return {
    id,
    label,
    target: {
      repoId: 'repo-1',
      worktreeId: 'worktree-1',
      executionHostId: 'local',
      tabId: 'tab-1',
      leafId: 'leaf-1'
    }
  }
}

describe('readDockAgentMenuPayload', () => {
  it('accepts empty groups and normalizes native menu labels', () => {
    expect(
      readDockAgentMenuPayload({
        active: [entry('a', '  Agent\nwith\tmessage  ')],
        unread: []
      })
    ).toEqual({
      active: [entry('a', 'Agent with message')],
      unread: []
    })
  })

  it('rejects duplicate ids and malformed targets', () => {
    expect(() =>
      readDockAgentMenuPayload({ active: [entry('same'), entry('same')], unread: [] })
    ).toThrow('Invalid Dock active agent')
    expect(() =>
      readDockAgentMenuPayload({
        active: [{ ...entry('bad'), target: { repoId: 'repo-1' } }],
        unread: []
      })
    ).toThrow('Invalid Dock active agent')
    expect(() =>
      readDockAgentMenuPayload({
        active: [
          {
            ...entry('bad-host'),
            target: { ...entry('bad-host').target, executionHostId: 'invalid' }
          }
        ],
        unread: []
      })
    ).toThrow('Invalid Dock active agent')
  })

  it('admits long groups so the native menu can page every matching conversation', () => {
    const entries = Array.from({ length: 421 }, (_, index) => entry(String(index)))
    expect(readDockAgentMenuPayload({ active: entries, unread: entries })).toEqual({
      active: entries,
      unread: entries
    })
  })

  it('rejects labels that become empty after whitespace cleanup', () => {
    expect(() =>
      readDockAgentMenuPayload({ active: [entry('empty', '\n\t')], unread: [] })
    ).toThrow('Invalid Dock active agent label')
  })

  it('bounds the label and target id contracts', () => {
    expect(() =>
      readDockAgentMenuPayload({
        active: [entry('a', 'x'.repeat(MAX_DOCK_AGENT_LABEL_LENGTH + 1))],
        unread: []
      })
    ).toThrow('Invalid Dock active agent')
    expect(() =>
      readDockAgentMenuPayload({
        active: [
          {
            ...entry('a'),
            target: { ...entry('a').target, tabId: 'x'.repeat(4_097) }
          }
        ],
        unread: []
      })
    ).toThrow('Invalid Dock active agent')
  })
})
