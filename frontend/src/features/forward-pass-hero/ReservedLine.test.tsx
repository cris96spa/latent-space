import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ReservedLine } from './ReservedLine'

describe('ReservedLine', () => {
  it('renders the live value over an invisible copy of the worst case', () => {
    const { container } = render(<ReservedLine sizer="decode · attention">decode</ReservedLine>)
    const sizer = container.querySelector('[aria-hidden="true"].invisible')
    expect(sizer?.textContent).toBe('decode · attention')
    // Both cells occupy the same grid cell, so the reserve sits behind the live value.
    expect(container.querySelectorAll('.col-start-1.row-start-1')).toHaveLength(2)
    expect(container.textContent).toContain('decode')
  })
})
