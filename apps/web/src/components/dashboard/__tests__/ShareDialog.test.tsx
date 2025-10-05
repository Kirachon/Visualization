import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareDialog from '../../dashboard/ShareDialog';
import dashboardService from '../../../services/dashboardService';
import userService from '../../../services/userService';

jest.mock('../../../services/dashboardService', () => ({ __esModule: true, default: { share: jest.fn(), generatePublicLink: jest.fn() } }));
jest.mock('../../../services/userService', () => ({ __esModule: true, default: { list: jest.fn().mockResolvedValue({ items: [], total: 0 }) } }));

describe('ShareDialog', () => {
  it('disables Share button until a user is selected', async () => {
    render(<ShareDialog dashboardId="d1" open onClose={() => {}} />);
    const shareBtn = screen.getByRole('button', { name: /share/i });
    expect(shareBtn).toBeDisabled();

    // Simulate user search triggers list
    fireEvent.change(screen.getByLabelText(/search user/i), { target: { value: 'a' } });
    await waitFor(() => expect(userService.list).toHaveBeenCalled());
  });
});

