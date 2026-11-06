import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

describe('smoke', () => {
  it('renders a div', () => {
    render(React.createElement('div', null, 'hello'))
    expect(screen.getByText('hello')).toBeTruthy()
  })
})
