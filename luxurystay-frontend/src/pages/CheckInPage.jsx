import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import api from '../lib/api';
import Icon from '../components/Icon';
import Spinner from '../components/Spinner';
import MetricTile from '../components/MetricTile';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(first = '', last = '') {
  return ((first[0] || '') + (last[0] || '')).toUpperCase() || '?';
}

function fmtCurrency(val) {
  if (val == null) return '—';
  return `€${Number(val).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
}

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long' });
}

function toDateInputValue(iso) {
  return iso ? String(iso).slice(0, 10) : '';
}

function addDaysInput(iso, days) {
  if (!iso) return '';
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const ARRIVAL_PREFERENCES = ['Down pillow', 'Espresso amenities', 'Daily Le Monde', 'Private dining', 'Sea-view side', 'No turn-down'];

function checklistFromPreferences(preferences = []) {
  const selected = new Set(preferences);
  return ARRIVAL_PREFERENCES.reduce((acc, preference) => {
    acc[preference] = selected.has(preference);
    return acc;
  }, {});
}

function notesForMode(reservation, isArrival) {
  return isArrival
    ? reservation.specialRequests || reservation.notes || ''
    : reservation.notes || reservation.specialRequests || '';
}

// ─── Sub-components ───────────────────────────────────────────────────────────



function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13, borderBottom: '1px solid var(--hairline)' }}>
      <span style={{ color: 'var(--mute)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function FolioLine({ d, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: 'var(--ink-3)' }}>
      <span>{d}</span>
      <span className="mono">{v}</span>
    </div>
  );
}

function StatusChip({ status }) {
  const map = {
    expected:   { cls: 'chip-reserved',    label: 'Expected' },
    arrived:    { cls: 'chip-available',   label: 'Arrived' },
    'checked-in': { cls: 'chip-occupied',  label: 'Checked in' },
    'in-room':  { cls: 'chip-occupied',    label: 'In-room' },
    'checked-out': { cls: 'chip-cleaning', label: 'Checked out' },
    departed:   { cls: 'chip-cleaning',    label: 'Departed' },
    cancelled:  { cls: 'chip-maintenance', label: 'Cancelled' },
  };
  const { cls, label } = map[status] || { cls: 'chip-reserved', label: status };
  return <span className={`chip ${cls}`}><span className="chip-dot" />{label}</span>;
}

// ─── Arrivals / Departures List ───────────────────────────────────────────────

function CheckInList({ list, mode, onSelect, loading, emptyLabel }) {
  const { isMobile } = useBreakpoint();
  const isArrival = mode === 'checkin';

  if (loading) return <div style={{ padding: 40 }}><Spinner page /></div>;
  if (!list.length) {
    return (
      <div className="t-wrap" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--mute)', fontSize: 13 }}>
        {emptyLabel || (isArrival ? 'No arrivals today.' : 'No departures today.')}
      </div>
    );
  }

  const summary = isArrival
    ? [
        { label: 'Expected today',  value: list.filter(r => ['pending','confirmed'].includes(r.status)).length },
        { label: 'Checked in',      value: list.filter(r => r.status === 'checked-in').length },
        { label: 'VIP arrivals',    value: list.filter(r => r.guest?.isVIP || r.guest?.tier === 'etoile').length },
        { label: 'Avg. stay',       value: list.length ? `${(list.reduce((a, b) => a + (b.nights || 0), 0) / list.length).toFixed(1)} nts` : '—' },
      ]
    : [
        { label: 'Departing today', value: list.length },
        { label: 'Still in-room',   value: list.filter(r => r.status === 'checked-in').length },
        { label: 'Checked out',     value: list.filter(r => r.status === 'checked-out').length },
        { label: 'Folios open',     value: list.filter(r => r.status === 'checked-in').length },
      ];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 1, background: 'var(--hairline)', border: '1px solid var(--hairline)', marginBottom: 28 }}>
        {summary.map((summary, i) => <MetricTile key={i} label={summary.label} value={summary.value} />)}
      </div>

      <div className="t-wrap">
        <table className="t">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Reservation</th>
              <th>Room</th>
              <th>Nights</th>
              {isArrival && <th>Check-out</th>}
              <th>{isArrival ? 'ETA' : 'Departure'}</th>
              <th>Status</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(r => {
              const firstName = r.guest?.firstName || '';
              const lastName  = r.guest?.lastName  || '';
              const fullName  = [firstName, lastName].filter(Boolean).join(' ') || '—';
              const initials  = getInitials(firstName, lastName);
              const isVIP     = r.guest?.isVIP || r.guest?.tier === 'etoile';
              const canAct    = isArrival
                ? ['pending','confirmed'].includes(r.status)
                : r.status === 'checked-in';

              return (
                <tr key={r._id} onClick={() => onSelect(r)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials}</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 500 }}>{fullName}</span>
                          {isVIP && <span className="chip chip-vip"><Icon name="crown" size={10} />Étoile</span>}
                        </div>
                        {r.specialRequests && (
                          <div style={{ fontSize: 10, color: 'var(--mute)', marginTop: 2 }}>{r.specialRequests}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="mono">{r.bookingId || r.id?.slice(-6).toUpperCase()}</span>
                    <div style={{ fontSize: 10, color: 'var(--mute)', marginTop: 2 }}>{r.source || '—'}</div>
                  </td>
                  <td>
                    <div className="numeral" style={{ fontSize: 18 }}>{r.room?.roomNumber || '—'}</div>
                    <div style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{r.room?.type?.replace('_', ' ') || ''}</div>
                  </td>
                  <td>{r.nights ?? '—'}</td>
                  {isArrival && <td><span className="mono">{r.checkOutDate?.slice(0, 10) || '—'}</span></td>}
                  <td><span className="mono">{r.eta || r.checkOutDate?.slice(0, 10) || '—'}</span></td>
                  <td><StatusChip status={r.status} /></td>
                  <td className="numeral">{fmtCurrency(r.totalAmount)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={e => { e.stopPropagation(); onSelect(r); }}
                    >
                      {isArrival
                        ? (canAct ? 'Check in' : 'View')
                        : (canAct ? 'Check out' : 'View')}
                      <Icon name="arrow_right" size={10} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function CheckInDetail({ reservation, mode, onBack, onDone, onUpdated }) {
  const toast = useToast();
  const { isMobile, isTablet } = useBreakpoint();
  const isArrival = mode === 'checkin';

  const [checklist, setChecklist] = useState(() => checklistFromPreferences(reservation.stayPreferences));
  const [notes, setNotes]         = useState(() => notesForMode(reservation, isArrival));
  const [loading, setLoading]     = useState(false);
  const [checkoutSaving, setCheckoutSaving] = useState(false);
  const [checkOutDate, setCheckOutDate] = useState(toDateInputValue(reservation.checkOutDate));

  const r          = reservation;
  const firstName  = r.guest?.firstName || '';
  const lastName   = r.guest?.lastName  || '';
  const fullName   = [firstName, lastName].filter(Boolean).join(' ') || '—';
  const initials   = getInitials(firstName, lastName);
  const isVIP      = r.guest?.isVIP || r.guest?.tier === 'etoile';
  const subtotal   = r.totalAmount || 0;
  const tax        = Math.round(subtotal * 0.1);
  const checkInDateValue = toDateInputValue(r.checkInDate);
  const currentCheckOutDate = toDateInputValue(r.checkOutDate);
  const minCheckOutDate = addDaysInput(r.checkInDate, 1);
  const checkoutDateChanged = isArrival && checkOutDate !== currentCheckOutDate;

  useEffect(() => {
    setChecklist(checklistFromPreferences(reservation.stayPreferences));
    setNotes(notesForMode(reservation, isArrival));
  }, [reservation, isArrival]);

  const arrivalItems   = ARRIVAL_PREFERENCES;
  const departureItems = ['Mini-bar verified', 'Safe emptied', 'Keys returned', 'Damage assessment', 'Lost & found cleared', 'Transfer dispatched'];
  const checklistItems = isArrival ? arrivalItems : departureItems;

  const canAct = isArrival
    ? ['pending', 'confirmed'].includes(r.status)
    : r.status === 'checked-in';

  async function handleAction() {
    setLoading(true);
    try {
      const endpoint = isArrival ? `/api/reservations/${r.id}/checkin` : `/api/reservations/${r.id}/checkout`;
      await api.patch(endpoint);
      toast.success(isArrival ? `${firstName} checked in to room ${r.room?.roomNumber}.` : `${fullName} checked out successfully.`);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckoutDateUpdate() {
    if (!checkOutDate) {
      toast.error('Select a check-out date.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkOutDate)) {
      toast.error('Use YYYY-MM-DD for the check-out date.');
      return;
    }
    if (checkInDateValue && new Date(checkOutDate) <= new Date(checkInDateValue)) {
      toast.error('Check-out date must be after check-in date.');
      return;
    }
    if (!checkoutDateChanged) return;

    setCheckoutSaving(true);
    try {
      const { data } = await api.patch(`/api/reservations/${r.id}`, { checkOutDate });
      const updated = data?.data?.reservation || data?.reservation;
      toast.success(`Check-out date updated to ${checkOutDate}.`);
      onUpdated(updated || { ...r, checkOutDate });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update check-out date.');
    } finally {
      setCheckoutSaving(false);
    }
  }

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 20 }}>
        <Icon name="arrow_left" size={12} />Back to {isArrival ? 'arrivals' : 'departures'}
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1.4fr 1fr', gap: isMobile ? 20 : 32 }}>
        {/* ── Left: main form ── */}
        <div>
          <div className="card" style={{ padding: 32 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              {isArrival ? 'Check-in · Identity & Preferences' : 'Check-out · Departure review'}
            </div>
            <h2 className="display" style={{ fontSize: 36, margin: '0 0 4px' }}>{fullName}</h2>
            <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
              {isVIP && <span className="chip chip-vip"><Icon name="crown" size={10} />Étoile</span>}
              <StatusChip status={r.status} />
              <span className="chip chip-reserved">{r.bookingId || '—'} · {r.nights ?? '—'} nights</span>
              {r.room && <span className="chip chip-reserved">Room {r.room.roomNumber} · {r.room.type?.replace('_', ' ')}</span>}
              {r.source && <span className="chip chip-reserved">Source · {r.source}</span>}
            </div>

            {isArrival ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 24, marginBottom: 28 }}>
                  <div className="field">
                    <label>Guest name</label>
                    <input readOnly value={fullName} />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input readOnly value={r.guest?.email || '—'} />
                  </div>
                  <div className="field">
                    <label>Phone</label>
                    <input readOnly value={r.guest?.phone || '—'} />
                  </div>
                  <div className="field">
                    <label>ETA</label>
                    <input readOnly value={r.eta || '—'} />
                  </div>
                  <div className="field">
                    <label>Check-in date</label>
                    <input type="date" readOnly value={checkInDateValue} />
                  </div>
                  <div className="field">
                    <label>Check-out date</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input
                        type="date"
                        value={checkOutDate}
                        min={minCheckOutDate}
                        onChange={e => setCheckOutDate(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={handleCheckoutDateUpdate}
                        disabled={checkoutSaving || !checkoutDateChanged}
                        style={{ whiteSpace: 'nowrap', opacity: checkoutSaving || !checkoutDateChanged ? 0.6 : 1 }}
                      >
                        {checkoutSaving
                          ? <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />Saving…</>
                          : <><Icon name="calendar" size={12} />Update</>}
                      </button>
                    </div>
                    {checkoutDateChanged && (
                      <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 6 }}>
                        Save the new date before issuing keys.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rule"><div className="dot" /></div>
                <div className="eyebrow" style={{ marginBottom: 14 }}>Stay preferences</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
                  {checklistItems.map((p, i) => (
                    <label key={i}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--hairline)', borderRadius: 2, fontSize: 12, cursor: 'default', background: checklist[p] ? 'var(--linen)' : 'transparent', color: checklist[p] ? 'var(--ink)' : 'var(--mute)' }}>
                      <span style={{ width: 14, height: 14, border: '1px solid var(--ink-3)', borderRadius: 2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: checklist[p] ? 'var(--ink)' : 'transparent' }}>
                        {checklist[p] && <Icon name="check" size={10} style={{ color: 'var(--paper)' }} />}
                      </span>
                      {p}
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="eyebrow" style={{ marginBottom: 14 }}>Folio review</div>
                <div style={{ marginBottom: 24 }}>
                  <FolioLine d={`Room · nightly rate × ${r.nights ?? 0}`} v={fmtCurrency(subtotal)} />
                  {r.services?.map((s, i) => (
                    <FolioLine key={i} d={s.description || s.type} v={fmtCurrency(s.amount)} />
                  ))}
                </div>
                <div className="rule"><div className="dot" /></div>
                <div className="eyebrow" style={{ marginBottom: 14 }}>Departure checklist</div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 24 }}>
                  {checklistItems.map((p, i) => (
                    <label key={i} onClick={() => setChecklist(c => ({ ...c, [p]: !c[p] }))}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--hairline)', borderRadius: 2, fontSize: 12, cursor: 'pointer', background: checklist[p] ? 'var(--linen)' : 'transparent' }}>
                      <span style={{ width: 14, height: 14, border: '1px solid var(--ink-3)', borderRadius: 2, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: checklist[p] ? 'var(--ink)' : 'transparent' }}>
                        {checklist[p] && <Icon name="check" size={10} style={{ color: 'var(--paper)' }} />}
                      </span>
                      {p}
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* Notes */}
            <div className="field" style={{ marginBottom: 28 }}>
              <label>Staff notes</label>
              <textarea value={notes} readOnly
                placeholder="Any notes for handover…"
                style={{ minHeight: 72, resize: 'vertical', cursor: 'default', color: notes ? 'var(--ink)' : 'var(--mute)' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn btn-ghost" onClick={onBack}>
                <Icon name="arrow_left" size={12} />Cancel
              </button>
              {canAct && (
                <button className="btn btn-primary" onClick={handleAction} disabled={loading || checkoutDateChanged}
                  style={{ opacity: loading || checkoutDateChanged ? 0.7 : 1 }}>
                  {loading
                    ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5, borderTopColor: 'var(--ivory)' }} />Processing…</>
                    : <>{isArrival ? 'Issue keys · Check in' : 'Settle folio · Check out'}<Icon name="arrow_right" size={12} /></>
                  }
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: summary card ── */}
        <div>
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              {isArrival ? 'Reservation summary' : 'Folio summary'}
            </div>
            <SummaryRow label="Confirmation" value={r.bookingId || '—'} />
            <SummaryRow label="Room" value={r.room ? `${r.room.roomNumber} · ${r.room.type?.replace('_', ' ')}` : '—'} />
            <SummaryRow label="Check-in"  value={checkInDateValue || '—'} />
            <SummaryRow label="Check-out" value={isArrival ? (checkOutDate || '—') : (currentCheckOutDate || '—')} />
            <SummaryRow label="Nights"    value={r.nights ?? '—'} />
            <SummaryRow label="Adults"    value={r.adults ?? '—'} />
            <SummaryRow label="Subtotal"  value={fmtCurrency(subtotal)} />
            <SummaryRow label="Tax (10%)" value={fmtCurrency(tax)} />
            <div style={{ marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="label">Total due</span>
              <span className="display numeral" style={{ fontSize: 32 }}>{fmtCurrency(subtotal + tax)}</span>
            </div>
          </div>

          {r.specialRequests && (
            <div className="card" style={{ padding: 24 }}>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Special requests</div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-3)' }}>
                {r.specialRequests}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TODAY_STR = new Date().toISOString().slice(0, 10);

export default function CheckInPage() {
  const { isMobile } = useBreakpoint();
  const [tab, setTab]               = useState('checkin');
  const [selected, setSelected]     = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: arrivalsData,   loading: arrivalsLoading }   = useApi('/api/reservations/today-arrivals',   { deps: [refreshKey] });
  const { data: departuresData, loading: departuresLoading } = useApi('/api/reservations/today-departures', { deps: [refreshKey] });
  const { data: checkedInData,  loading: checkedInLoading }  = useApi('/api/reservations?status=checked-in&limit=200', { deps: [refreshKey] });

  const arrivals   = arrivalsData?.arrivals    || [];
  const departures = departuresData?.departures || [];
  const overdue    = (checkedInData?.reservations || []).filter(
    r => r.checkOutDate && r.checkOutDate.slice(0, 10) < TODAY_STR
  );

  const list    = tab === 'checkin' ? arrivals : tab === 'checkout' ? departures : overdue;
  const loading = tab === 'checkin' ? arrivalsLoading : tab === 'checkout' ? departuresLoading : checkedInLoading;

  function switchTab(t) { setTab(t); setSelected(null); }
  function handleDone()  { setSelected(null); setRefreshKey(k => k + 1); }
  function handleUpdated(reservation) {
    setSelected(reservation);
    setRefreshKey(k => k + 1);
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Front desk · {todayLabel()}</div>
          <h1 className="display">Welcome, &amp; <em>au revoir</em>.</h1>
          <p className="sub">
            Confirm identity, allocate keys, and brief the housekeeping team.
            Departures are auto-routed to billing on completion.
          </p>
        </div>
        <div className="switch" style={{ flexWrap: 'wrap' }}>
          <button className={tab === 'checkin'  ? 'active' : ''} onClick={() => switchTab('checkin')}>
            Arrivals · {arrivals.length}
          </button>
          <button className={tab === 'checkout' ? 'active' : ''} onClick={() => switchTab('checkout')}>
            Departures · {departures.length}
          </button>
          <button className={tab === 'overdue'  ? 'active' : ''} onClick={() => switchTab('overdue')}
            style={{ position: 'relative' }}>
            Overdue
            {overdue.length > 0 && (
              <span style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, borderRadius: 9, background: 'var(--terracotta)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '0 4px' }}>
                {overdue.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {selected ? (
        <CheckInDetail
          reservation={selected}
          mode={tab === 'overdue' ? 'checkout' : tab}
          onBack={() => setSelected(null)}
          onDone={handleDone}
          onUpdated={handleUpdated}
        />
      ) : (
        <CheckInList
          list={list}
          mode={tab === 'overdue' ? 'checkout' : tab}
          onSelect={setSelected}
          loading={loading}
          emptyLabel={tab === 'overdue' ? 'No overdue checkouts — all guests are within their stay dates.' : undefined}
        />
      )}
    </div>
  );
}
