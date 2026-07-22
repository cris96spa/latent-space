import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'

import { VocabularySection } from './VocabularySection'
import { VOCABULARY_TOKENS } from './tokens'
import { renderInApp } from '../../test/render'

// The skills radar renders on the home page already and is out of scope for this unit;
// stub it so the test targets the vocabulary toggle and chips only.
vi.mock('../skills-radar', () => ({ SkillsRadarSection: () => null }))

const python = VOCABULARY_TOKENS.find((token) => token.label === 'Python')!
const pythonIds = python.ids.join(' ')
const pythonChipName = `Python — GPT-2 token IDs ${pythonIds}`

describe('VocabularySection', () => {
  it('shows the word on each chip, with input_ids offered on hover, by default', () => {
    renderInApp(<VocabularySection />)
    const chip = screen.getByLabelText(pythonChipName)
    expect(chip).toHaveTextContent('Python')
    expect(chip).not.toHaveTextContent(pythonIds)
    expect(screen.getAllByText('input_ids')).toHaveLength(VOCABULARY_TOKENS.length)
    expect(screen.queryByText('text')).not.toBeInTheDocument()
  })

  it('reveals the reverse representation as a hover cross-reference', () => {
    renderInApp(<VocabularySection />)
    // The word chip is visible; its token IDs live in the (decorative) hover tooltip.
    expect(screen.getByText(pythonIds)).toBeInTheDocument()
  })

  it('flips chips to token IDs and the hover label to text in the For LLMs view', async () => {
    const user = userEvent.setup()
    renderInApp(<VocabularySection />)

    await user.click(screen.getByRole('radio', { name: 'For LLMs' }))
    expect(screen.getByLabelText(pythonChipName)).toHaveTextContent(pythonIds)
    expect(screen.getAllByText('text')).toHaveLength(VOCABULARY_TOKENS.length)
    expect(screen.queryByText('input_ids')).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'For Humans' }))
    expect(screen.getByLabelText(pythonChipName)).toHaveTextContent('Python')
  })

  it('keeps both representations in each chip accessible name', () => {
    renderInApp(<VocabularySection />)
    expect(screen.getByLabelText(pythonChipName)).toBeInTheDocument()
  })

  it('has no accessibility violations in either view', async () => {
    const user = userEvent.setup()
    const { container } = renderInApp(<VocabularySection />)
    expect(await axe(container)).toHaveNoViolations()
    await user.click(screen.getByRole('radio', { name: 'For LLMs' }))
    expect(await axe(container)).toHaveNoViolations()
  })
})
