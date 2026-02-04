'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const MainShell = ({ children }: { children: ReactNode }) => (
  <div className="main-shell">
    <Sidebar />
    <main className="content-area">
      <Topbar />
      {children}
    </main>
  </div>
);
