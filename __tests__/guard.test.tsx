import { render, screen } from '@testing-library/react';
import { Guard } from '@/lib/auth/guard';
import { SessionContext, type SessionState } from '@/lib/auth/org-context';

const baseState: SessionState = {
  userId: 'user-1',
  orgId: 'org-1',
  role: 'lector',
  loading: false,
  setOrgId: () => {}
};

describe('Guard', () => {
  it('blocks action when role is insufficient', () => {
    render(
      <SessionContext.Provider value={baseState}>
        <Guard permission="manageUsers" fallback={<span>blocked</span>}>
          <span>allowed</span>
        </Guard>
      </SessionContext.Provider>
    );
    expect(screen.getByText('blocked')).toBeInTheDocument();
  });

  it('allows action when role is admin', () => {
    render(
      <SessionContext.Provider value={{ ...baseState, role: 'admin' }}>
        <Guard permission="manageUsers" fallback={<span>blocked</span>}>
          <span>allowed</span>
        </Guard>
      </SessionContext.Provider>
    );
    expect(screen.getByText('allowed')).toBeInTheDocument();
  });
});
