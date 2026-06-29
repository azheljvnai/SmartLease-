import { useEffect, useRef, useState } from 'react';
import { Bell, Check, CreditCard, FileText, Megaphone, Wrench } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
} from '../../../services/notifications.service';
import type { AppNotification } from '../../../types';
import { formatRelativeTime } from '../../../lib/format';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';

const typeIcons: Record<string, typeof Bell> = {
  payment: CreditCard,
  lease: FileText,
  maintenance: Wrench,
  notice: Megaphone,
};

function getNotificationIcon(type?: string) {
  if (!type) return Bell;
  return typeIcons[type] ?? Bell;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeNotifications(user.uid, setNotifications);
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const unread = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.uid, notifications);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'relative rounded-lg p-2 transition-colors hover:bg-accent',
          open && 'bg-accent',
        )}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="font-semibold text-sm">Notifications</p>
              {unread > 0 && (
                <p className="text-xs text-muted-foreground">{unread} unread</p>
              )}
            </div>
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary"
                onClick={handleMarkAllRead}
              >
                <Check className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>

          <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Bell className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No notifications</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Updates about payments, lease, and maintenance appear here
                </p>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => {
                  const Icon = getNotificationIcon(n.type);
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        className={cn(
                          'flex w-full gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent/50',
                          !n.read && 'bg-primary/5',
                        )}
                        onClick={() => !n.read && handleMarkRead(n.id)}
                      >
                        <div
                          className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            n.read ? 'bg-muted' : 'bg-primary/10',
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4',
                              n.read ? 'text-muted-foreground' : 'text-primary',
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn('font-medium', !n.read && 'text-foreground')}>
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {n.body}
                          </p>
                          {n.createdAt && (
                            <p className="mt-1 text-[11px] text-muted-foreground/70">
                              {formatRelativeTime(
                                n.createdAt instanceof Date
                                  ? n.createdAt
                                  : String(n.createdAt),
                              )}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
