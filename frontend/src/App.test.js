import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the auth screen', () => {
  render(<App />);
  expect(screen.getByText(/minimal notes for clear thinking/i)).toBeInTheDocument();
});
