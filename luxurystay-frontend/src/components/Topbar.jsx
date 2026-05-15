import { useLocation } from 'react-router-dom';
import Icon from './Icon';

const CRUMBS = {
  '/dashboard':    ['Operations', 'Dashboard'],
  '/reservations': ['Operations', 'Reservations'],
  '/checkin':      ['Operations', 'Front Desk'],
  '/rooms':        ['Operations', 'Rooms'],
  '/housekeeping': ['Operations', 'Housekeeping'],
  '/maintenance':  ['Operations', 'Maintenance'],
  '/billing':      ['Commerce', 'Billing'],
  '/guests':       ['Commerce', 'Guests'],
  '/feedback':     ['Commerce', 'Feedback'],
  '/analytics':    ['Administration', 'Analytics'],
  '/staff':        ['Administration', 'Staff'],
  '/settings':     ['Administration', 'Settings'],
};

export default function Topbar({ unreadCount = 0, onNotifClick }) {
  const { pathname } = useLocation();
  const base = '/' + pathname.split('/')[1];
  const crumbs = CRUMBS[base] || ['—'];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="crumbs">
          {crumbs.map((c, i) => (
            <span key={i}>
              {i > 0 && <span className="sep">/</span>}
              <span className={i === crumbs.length - 1 ? 'current' : ''}>{c}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="topbar-right">
        <div className="search">
          <Icon name="search" size={14} />
          <span>Search rooms, guests, reservations…</span>
          <span className="kbd" style={{ marginLeft: 'auto' }}>⌘K</span>
        </div>

        <button className="icon-btn" title="Notifications" onClick={onNotifClick} style={{ position: 'relative' }}>
          <Icon name="bell" size={16} />
          {unreadCount > 0 && <span className="dot" />}
        </button>
      </div>
    </header>
  );
}
