import { render, screen } from '@testing-library/react';
import App from '../../client/graph-project-react-app/src/App';

test('renders Query Page header', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /research graph/i })).toBeInTheDocument();
});
