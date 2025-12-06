import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders App with routing', () => {
    // App already contains Router, so don't wrap it
    render(<App />);
    // App renders Navbar and routing - check for Navbar or HomePage content
    expect(screen.getByText(/Graph-Based Research Paper Discovery/i)).toBeInTheDocument();
  });
});
