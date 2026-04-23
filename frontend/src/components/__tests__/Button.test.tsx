import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children and handles click', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Crear</Button>);
    const btn = screen.getByRole('button', { name: 'Crear' });
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies danger variant classes', () => {
    render(<Button variant="danger">Borrar</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });

  it('respects disabled', async () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
