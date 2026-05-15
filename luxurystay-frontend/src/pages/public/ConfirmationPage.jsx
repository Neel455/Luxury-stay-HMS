import { useLocation, useNavigate } from 'react-router-dom';
import PublicShell from '../../layouts/PublicShell';
import Icon from '../../components/Icon';
import Ornament from '../../components/Ornament';

// Suite type → Photo tone (used for the NAME_TONES map — not a Photo here, kept for reference)
const NAME_TONES = {
  'Deluxe Twin':   'ivory',
  'Deluxe King':   'warm',
  'Junior Suite':  'sand',
  'Premier Suite': 'deep',
  'Penthouse':     'night',
};

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
}

function ConfirmRow({ l, v, sub }) {
  return (
    <div style={{ paddingBottom: 18, borderBottom: '1px dotted var(--hairline)' }}>
      <div className="label" style={{ marginBottom: 4 }}>{l}</div>
      <div style={{ fontSize: 15, fontFamily: 'var(--serif)', fontStyle: 'italic', lineHeight: 1.3 }}>{v || '—'}</div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 3, letterSpacing: '0.03em', fontWeight: 500 }}>{sub}</div>
      )}
    </div>
  );
}

export default function ConfirmationPage() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const booking   = state?.booking;

  if (!booking) {
    return (
      <PublicShell>
        <section style={{ padding: '100px 64px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <Ornament>·  ★  ·</Ornament>
          <div className="eyebrow" style={{ margin: '24px 0 18px', color: 'var(--brass-deep)' }}>Nothing to show</div>
          <h1 className="display" style={{ fontSize: 'clamp(48px, 6vw, 80px)', margin: '0 0 20px', lineHeight: 1 }}>
            No booking <em>found.</em>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 32px', fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
            This page is only accessible right after completing a reservation.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/book')}>
            Make a reservation <Icon name="arrow_right" size={12} />
          </button>
        </section>
      </PublicShell>
    );
  }

  // Prefer bookingContact (per-booking snapshot) over the live guest profile name
  const contactName  = booking.bookingContact
    ? `${booking.bookingContact.firstName} ${booking.bookingContact.lastName}`.trim()
    : booking.guest?.name || '';
  const guestFirst   = booking.bookingContact?.firstName || booking.guest?.name?.split(' ')[0] || 'dear guest';
  const arrivalMonth = booking.checkIn
    ? new Date(booking.checkIn + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long' })
    : 'soon';

  const nights       = booking.nights || 0;
  const spaNote      = nights >= 3 ? 'Spa ritual gift included' : null;
  const totalAmt     = booking.totalAmount   || 0;
  const depositAmt   = booking.depositAmount || Math.round(totalAmt * 0.3);
  const balanceAmt   = totalAmt - depositAmt;

  const cancelBy = (() => {
    if (!booking.checkIn) return null;
    const d = new Date(booking.checkIn + 'T00:00:00');
    d.setDate(d.getDate() - 3);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  const barcodeDate = booking.checkIn
    ? (() => {
        const d = new Date(booking.checkIn + 'T00:00:00');
        return `${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getFullYear()).slice(2)}`;
      })()
    : '——';
  const barcodeCode = `RS · ${booking.bookingId || '—'} · ${barcodeDate}`;

  const roomLabel  = booking.room?.type || '—';
  const roomSub    = booking.room?.number ? `Floor ${booking.room.floor} · Suite ${booking.room.number}` : null;
  const guestCount = `${booking.adults} adult${booking.adults !== 1 ? 's' : ''}${booking.children ? `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}` : ''}`;

  return (
    <PublicShell>
      <section style={{ padding: '60px 64px 100px', maxWidth: 1080, margin: '0 auto' }}>

        {/* ── Centred header ──────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <Ornament>·  ★  ·</Ornament>
          <div className="eyebrow" style={{ margin: '24px 0 18px', color: 'var(--brass-deep)' }}>
            Reservation confirmed
          </div>
          <h1 className="display" style={{
            fontSize: 'clamp(56px, 7.4vw, 96px)',
            margin: 0, lineHeight: 1.02, letterSpacing: '-0.02em',
          }}>
            Until <em>{arrivalMonth}.</em>
          </h1>
          <p style={{
            fontSize: 16, color: 'var(--ink-3)', lineHeight: 1.7,
            maxWidth: 560, margin: '28px auto 0',
            fontFamily: 'var(--serif)', fontStyle: 'italic',
          }}>
            A confirmation has been sent to{' '}
            <strong style={{ fontStyle: 'normal', color: 'var(--ink)' }}>{booking.guest?.email}</strong>.
            Our concierge will be in touch shortly to arrange any preferences for your arrival.
          </p>
        </div>

        {/* ── Ticket ──────────────────────────────────────────────────── */}
        <div style={{
          position: 'relative',
          display: 'grid', gridTemplateColumns: '1.4fr 1fr',
          border: '1px solid var(--ink)', background: 'var(--paper)',
        }}>
          {/* Perforation line */}
          <div style={{
            position: 'absolute',
            left: 'calc(58.3% - 0.5px)', top: 0, bottom: 0,
            width: 1, borderLeft: '2px dashed var(--hairline)',
            pointerEvents: 'none',
          }} />
          {/* Notch top */}
          <div style={{
            position: 'absolute',
            left: 'calc(58.3% - 8px)', top: -8,
            width: 16, height: 16, borderRadius: '50%',
            background: 'var(--ivory)', border: '1px solid var(--ink)',
          }} />
          {/* Notch bottom */}
          <div style={{
            position: 'absolute',
            left: 'calc(58.3% - 8px)', bottom: -8,
            width: 16, height: 16, borderRadius: '50%',
            background: 'var(--ivory)', border: '1px solid var(--ink)',
          }} />

          {/* ── Left panel ── */}
          <div style={{ padding: 48 }}>
            {/* Brand + confirmation number */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: 28,
            }}>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontStyle: 'italic' }}>
                  <em>Luxury</em>STAY
                </div>
                <div className="eyebrow" style={{ marginTop: 8 }}>Boarding pass · Maison Étoile</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="eyebrow" style={{ marginBottom: 4 }}>Confirmation</div>
                <div className="display numeral" style={{ fontSize: 28, fontStyle: 'italic' }}>
                  {booking.bookingId || '—'}
                </div>
              </div>
            </div>

            {/* Detail rows */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
              <ConfirmRow
                l="Guest"
                v={contactName}
              />
              <ConfirmRow
                l="Suite"
                v={roomLabel}
                sub={roomSub}
              />
              <ConfirmRow
                l="Arrival"
                v={fmtDate(booking.checkIn)}
                sub="from 15:00 · luggage storage available"
              />
              <ConfirmRow
                l="Departure"
                v={fmtDate(booking.checkOut)}
                sub="by 12:00 · late check-out on request"
              />
              <ConfirmRow
                l="Nights"
                v={String(nights)}
                sub={spaNote}
              />
              <ConfirmRow
                l="Guests"
                v={guestCount}
              />
            </div>

            {/* Concierge note */}
            <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Concierge note · before you arrive</div>
              <p style={{
                fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.7,
                fontFamily: 'var(--serif)', fontStyle: 'italic', margin: 0,
              }}>
                Our concierge desk will be in touch within the day to ask about transfers,
                dietary preferences, and any small marks of the occasion you'd like us to attend to.
              </p>
            </div>
          </div>

          {/* ── Right panel (linen) ── */}
          <div style={{ padding: 48, background: 'var(--linen)' }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Folio total</div>
            <div className="display numeral" style={{ fontSize: 52, lineHeight: 1, fontStyle: 'italic', marginBottom: 6 }}>
              €{totalAmt.toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: 'var(--mute)', marginBottom: 24, fontWeight: 500 }}>
              incl. VAT · all extras settled on departure
            </div>

            <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: 'var(--mute)', fontWeight: 500 }}>Deposit · 30%</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>€{depositAmt.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--mute)', fontWeight: 500 }}>Balance on arrival</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>€{balanceAmt.toLocaleString()}</span>
              </div>
            </div>

            {/* Cancellation policy */}
            <div style={{
              padding: '12px 14px', marginBottom: 24,
              background: 'var(--paper)', border: '1px solid var(--hairline)',
              fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6, fontWeight: 500,
            }}>
              <strong style={{ fontWeight: 600 }}>Free cancellation</strong>
              {cancelBy ? ` through ${cancelBy}` : ' up to 72h before arrival'}.
              After that, the deposit is retained.
            </div>

            {/* Barcode */}
            <div style={{ display: 'flex', gap: 1, height: 36, marginBottom: 8 }}>
              {Array.from({ length: 38 }).map((_, i) => (
                <div
                  key={i}
                  style={{ flex: i % 3 === 0 ? 2 : i % 5 === 0 ? 3 : 1, background: 'var(--ink)' }}
                />
              ))}
            </div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 12,
              color: 'var(--mute)', letterSpacing: '0.18em', textAlign: 'center', fontWeight: 500,
            }}>
              {barcodeCode}
            </div>
          </div>
        </div>

        {/* ── Action buttons ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => window.print()}>
            <Icon name="download" size={12} /> Save as PDF
          </button>
          <button className="btn btn-ghost">
            <Icon name="mail" size={12} /> Email me a copy
          </button>
          <button className="btn btn-ghost">
            <Icon name="calendar" size={12} /> Add to calendar
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/guest')}>
            Open My Stay <Icon name="arrow_right" size={12} />
          </button>
        </div>

        {/* ── What happens next ───────────────────────────────────────── */}
        <div style={{ marginTop: 64 }}>
          <div className="eyebrow" style={{ marginBottom: 18 }}>What happens next</div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 1, background: 'var(--hairline)',
            border: '1px solid var(--hairline)',
          }}>
            {[
              { n: 'I',   t: 'Concierge call',      s: 'Within 24h · preferences' },
              { n: 'II',  t: 'Confirmation pack',    s: 'Letter + key code by post' },
              { n: 'III', t: 'Travel notes',         s: '48h before arrival' },
              { n: 'IV',  t: 'Welcome',              s: 'Suite ready from 15:00' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--paper)', padding: '24px 24px 28px' }}>
                <div style={{
                  fontFamily: 'var(--serif)', fontSize: 28,
                  fontStyle: 'italic', color: 'var(--brass-deep)', marginBottom: 10,
                }}>
                  {item.n}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{item.t}</div>
                <div style={{ fontSize: 12, color: 'var(--mute)', letterSpacing: '0.05em', fontWeight: 500 }}>{item.s}</div>
              </div>
            ))}
          </div>
        </div>

      </section>
    </PublicShell>
  );
}
