import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppLayout from '../ui/AppLayout.jsx';

describe('AppLayout', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
