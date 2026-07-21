import { describe, expect, it } from 'vitest'

import {
  chinchillaLoss,
  DATA_COEFFICIENT,
  DATA_EXPONENT,
  initialLoss,
  IRREDUCIBLE_LOSS,
  MODEL_PARAMETERS,
  PARAMETER_COEFFICIENT,
  PARAMETER_EXPONENT,
  sampleAblationSweep,
  SWEEP_FAMILIES,
  TRAINED_TOKENS,
  VOCABULARY_SIZE,
} from './scalingLaw'

describe('GPT-2-scaled loss sweep', () => {
  it('uses the closed-form Chinchilla fit', () => {
    const expected =
      IRREDUCIBLE_LOSS +
      PARAMETER_COEFFICIENT / MODEL_PARAMETERS ** PARAMETER_EXPONENT +
      DATA_COEFFICIENT / TRAINED_TOKENS ** DATA_EXPONENT

    expect(chinchillaLoss(MODEL_PARAMETERS, TRAINED_TOKENS)).toBeCloseTo(expected, 12)
  })

  it('uses GPT-2 vocabulary size for the uniform-prediction ceiling', () => {
    expect(initialLoss(VOCABULARY_SIZE)).toBeCloseTo(Math.log(50257), 12)
  })

  it('ends every simulated run at the declared modeling horizon', () => {
    sampleAblationSweep(3).forEach((run) => {
      expect(run.samples[run.samples.length - 1].tokens).toBe(TRAINED_TOKENS)
    })
    expect(SWEEP_FAMILIES.map((family) => family.id)).toContain('dropout')
    expect(SWEEP_FAMILIES.map((family) => family.id)).not.toContain('rope-theta')
  })
})
