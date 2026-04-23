import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('does not render when closed', () => {
    render(
      <Modal open={false} title="Demo" onClose={() => undefined}>
        contenido
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders when open and invokes onClose on Escape', async () => {
    const onClose = jest.fn();
    render(
      <Modal open title="Demo" onClose={onClose}>
        contenido
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'Demo' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
