import { render } from '@testing-library/react';

jest.mock('../features/boards/api', () => ({
  boardsApi: { list: jest.fn().mockResolvedValue([]) },
}));

import App from '../App';

describe('App', () => {
  it('mounts without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});
