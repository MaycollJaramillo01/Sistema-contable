import { render, screen } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';
import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword: vi.fn() }
  })
}));

describe('LoginPage', () => {
  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
    expect(screen.getByText('Entrar')).toBeInTheDocument();
  });
});
