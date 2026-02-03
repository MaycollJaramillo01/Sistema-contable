import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IncomePage from '@/app/(app)/income/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionContext, type SessionState } from '@/lib/auth/org-context';
import { vi } from 'vitest';

const insertMock = vi.fn().mockReturnValue({
  select: () => ({
    single: () => Promise.resolve({ data: { id: '1' }, error: null })
  })
});

const fromMock = vi.fn().mockReturnValue({
  insert: insertMock,
  select: vi.fn().mockResolvedValue({ data: [] }),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis()
});

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: fromMock
  })
}));

const state: SessionState = {
  userId: 'user-1',
  orgId: 'org-1',
  role: 'tesorero',
  loading: false,
  setOrgId: () => {}
};

describe('IncomePage', () => {
  it('creates income transaction', async () => {
    const user = userEvent.setup();
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <SessionContext.Provider value={state}>
          <IncomePage />
        </SessionContext.Provider>
      </QueryClientProvider>
    );

    await user.type(screen.getByPlaceholderText('Monto'), '100');
    await user.type(screen.getByPlaceholderText('Fuente'), 'donacion');
    await user.click(screen.getByRole('button', { name: 'Registrar' }));

    expect(insertMock).toHaveBeenCalled();
  });
});
