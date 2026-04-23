import { render, screen } from '@testing-library/react';
import { Spinner } from '../Spinner';

describe('Spinner', () => {
  it('renders default label with live region', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando');
  });

  it('accepts a custom label', () => {
    render(<Spinner label="Guardando…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Guardando');
  });
});
