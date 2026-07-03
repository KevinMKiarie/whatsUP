'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import {
  LayoutDashboard, CalendarDays, Settings,
  MessageSquare, ChevronLeft, ChevronRight,
  Star, FileText, Radio, LogOut, Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard',             label: 'Overview',   icon: LayoutDashboard, badge: null },
  { href: '/dashboard/bookings',    label: 'Bookings',   icon: CalendarDays,    badge: '5'  },
  { href: '/dashboard/invoices',    label: 'Invoices',   icon: FileText,        badge: null },
  { href: '/dashboard/broadcast',   label: 'Broadcast',  icon: Radio,           badge: null },
  { href: '/dashboard/whatsapp',    label: 'WhatsApp',   icon: Smartphone,      badge: null },
  { href: '/dashboard/settings',    label: 'Settings',   icon: Settings,        badge: null },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const path    = usePathname();
  const router  = useRouter();

  async function logout() {
    await authClient.signOut();
    router.push('/login');
  }

  return (
    <aside
      style={{ width: collapsed ? 64 : 224 }}
      className="relative flex h-full flex-col bg-white border-r border-black/[0.06] transition-[width] duration-200 ease-in-out shrink-0 overflow-hidden"
    >
      {/* Brand */}
      <div className={cn(
        'flex h-[52px] items-center shrink-0 border-b border-black/[0.06] px-4 gap-2.5',
        collapsed && 'justify-center px-0 gap-0'
      )}>
        <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#FF9500] shrink-0">
          <MessageSquare className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="text-[13px] font-semibold tracking-[-0.02em] text-[#1C1C1E] whitespace-nowrap">
            WhatsUP
          </span>
        )}
      </div>

      {/* Section label */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-1">
          <span className="text-[10px] font-semibold tracking-[0.04em] uppercase text-[#AEAEB2]">
            Workspace
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-hidden">
        {nav.map(({ href, label, icon: Icon, badge }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-[8px] px-2.5 py-[7px] text-[13px] font-medium transition-all duration-100 group relative',
                collapsed && 'justify-center w-10 mx-auto px-0',
                active
                  ? 'bg-[rgba(255,149,0,0.08)] text-[#FF9500]'
                  : 'text-[#6E6E73] hover:bg-[rgba(0,0,0,0.04)] hover:text-[#1C1C1E]'
              )}
            >
              <Icon
                className={cn(
                  'h-[15px] w-[15px] shrink-0 transition-colors',
                  active ? 'text-[#FF9500]' : 'text-[#AEAEB2] group-hover:text-[#6E6E73]'
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              {!collapsed && (
                <>
                  <span className="whitespace-nowrap">{label}</span>
                  {badge && (
                    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-black/[0.06] px-1 text-[10px] font-semibold text-[#6E6E73]">
                      {badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-black/[0.06]" />

      {/* Footer */}
      <div className="px-2 py-3 space-y-1 shrink-0">
        {/* Business info row */}
        {!collapsed && (
          <div className="flex items-center gap-2 px-2.5 py-1.5">
            <div className="h-5 w-5 rounded-full bg-[#FF9500] flex items-center justify-center shrink-0">
              <span className="text-[9px] font-bold text-white">GS</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-[#1C1C1E]">Glow Studio</p>
              <p className="truncate text-[10px] text-[#AEAEB2]">salon · 4 services</p>
            </div>
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 text-[#FF9500]" fill="#FF9500" />
              <span className="text-[10px] font-medium text-[#6E6E73]">4.8</span>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className={cn(
            'flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-[11px] font-medium text-[#AEAEB2] hover:bg-[rgba(255,59,48,0.06)] hover:text-[#FF3B30] transition-colors',
            collapsed ? 'justify-center px-0 w-10 mx-auto' : 'gap-1.5'
          )}
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(prev => !prev)}
          className={cn(
            'flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-[11px] font-medium text-[#AEAEB2] hover:bg-[rgba(0,0,0,0.04)] hover:text-[#6E6E73] transition-colors',
            collapsed ? 'justify-center px-0 w-10 mx-auto' : 'gap-1.5'
          )}
        >
          {collapsed
            ? <ChevronRight className="h-3.5 w-3.5" />
            : <><ChevronLeft className="h-3.5 w-3.5" /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );
}
