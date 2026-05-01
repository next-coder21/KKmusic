/* AdminUI.jsx — shared primitives, theme-aware via CSS custom properties */
import React from 'react';

export const card = {
  background: 'var(--a-bg2)',
  border: '1px solid var(--a-border)',
  borderRadius: 12,
};

export const Card = ({ children, style = {}, p = 20 }) => (
  <div style={{ ...card, padding: p, ...style }}>{children}</div>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
    <div>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--a-text)', margin: 0, letterSpacing: '-0.03em' }}>{title}</h1>
      {subtitle && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--a-muted)' }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Btn = ({ children, onClick, variant = 'primary', disabled, style = {}, size = 'md', icon: Icon }) => {
  const pad = size === 'sm' ? '6px 12px' : '9px 18px';
  const fs = size === 'sm' ? 11 : 13;
  const bg = {
    primary: 'linear-gradient(135deg,#ec4899,#6366f1)',
    ghost: 'transparent',
    danger: 'rgba(239,68,68,0.1)',
    outline: 'transparent',
  }[variant];
  const color = { primary: '#fff', ghost: 'var(--a-subtle)', danger: '#ef4444', outline: 'var(--a-muted)' }[variant];
  const border = { primary: 'none', ghost: '1px solid var(--a-border)', danger: '1px solid rgba(239,68,68,0.2)', outline: '1px solid var(--a-border3)' }[variant];

  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: pad, borderRadius: 8, border, background: bg, color, fontSize: fs, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.12s', fontFamily: 'inherit', opacity: disabled ? 0.5 : 1, ...style }}>
      {Icon && <Icon size={fs - 1} />}
      {children}
    </button>
  );
};

export const Tag = ({ children, color = '#6b7280' }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}35`, fontSize: 10, fontWeight: 700, color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
    {children}
  </span>
);

export const Empty = ({ message = 'No data found' }) => (
  <div style={{ padding: '48px 0', textAlign: 'center' }}>
    <p style={{ fontSize: 13, color: 'var(--a-faint)', margin: 0 }}>{message}</p>
  </div>
);

export const Skeleton = ({ h = 14, w = '100%', r = 6 }) => (
  <div style={{ height: h, width: w, borderRadius: r, background: 'var(--a-border2)', animation: 'shimmer 1.4s ease-in-out infinite' }} />
);

export const SkeletonRows = ({ cols = 4, rows = 8 }) => (
  <tbody>
    {[...Array(rows)].map((_, ri) => (
      <tr key={ri}>
        {[...Array(cols)].map((_, ci) => (
          <td key={ci} style={{ padding: '12px 16px' }}>
            <div style={{ height: 13, width: ci === 0 ? '70%' : '50%', borderRadius: 4, background: 'var(--a-border2)', animation: 'shimmer 1.4s ease-in-out infinite' }} />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

export const Th = ({ children, right }) => (
  <th style={{ padding: '11px 16px', fontSize: 10, color: 'var(--a-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, textAlign: right ? 'right' : 'left', borderBottom: '1px solid var(--a-border)', background: 'var(--a-bg5)', whiteSpace: 'nowrap' }}>
    {children}
  </th>
);

export const Td = ({ children, right, muted }) => (
  <td style={{ padding: '11px 16px', fontSize: 13, color: muted ? 'var(--a-muted)' : 'var(--a-text2)', textAlign: right ? 'right' : 'left', borderBottom: '1px solid var(--a-border2)', verticalAlign: 'middle' }}>
    {children}
  </td>
);

export const Modal = ({ open, onClose, title, children, maxWidth = 480 }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div style={{ ...card, width: '100%', maxWidth, padding: 28, position: 'relative', zIndex: 10, boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: 1, background: 'linear-gradient(90deg,transparent,rgba(236,72,153,0.3),transparent)' }} />
        {title && <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--a-text)', margin: '0 0 20px', letterSpacing: '-0.02em' }}>{title}</h2>}
        {children}
      </div>
    </div>
  );
};

export const Input = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    {label && <label style={{ fontSize: 10, color: 'var(--a-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</label>}
    <input {...props}
      style={{ width: '100%', background: 'var(--a-bg4)', border: '1px solid var(--a-border3)', borderRadius: 8, padding: '9px 12px', color: 'var(--a-text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.12s', ...(props.style || {}) }}
      onFocus={e => { e.target.style.borderColor = '#ec4899'; if (props.onFocus) props.onFocus(e); }}
      onBlur={e => { e.target.style.borderColor = 'var(--a-border3)'; if (props.onBlur) props.onBlur(e); }}
    />
  </div>
);

export const Textarea = ({ label, rows = 4, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    {label && <label style={{ fontSize: 10, color: 'var(--a-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</label>}
    <textarea rows={rows} {...props}
      style={{ width: '100%', background: 'var(--a-bg4)', border: '1px solid var(--a-border3)', borderRadius: 8, padding: '9px 12px', color: 'var(--a-text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', transition: 'border-color 0.12s', ...(props.style || {}) }}
      onFocus={e => { e.target.style.borderColor = '#ec4899'; if (props.onFocus) props.onFocus(e); }}
      onBlur={e => { e.target.style.borderColor = 'var(--a-border3)'; if (props.onBlur) props.onBlur(e); }}
    />
  </div>
);

export const FormRow = ({ children, cols = 2 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>{children}</div>
);

export const ModalFooter = ({ onCancel, onSubmit, submitLabel = 'Save', loading }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--a-border)' }}>
    <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
    <Btn onClick={onSubmit} disabled={loading}>{loading ? 'Saving...' : submitLabel}</Btn>
  </div>
);

export const TableWrap = ({ children, maxHeight = 'calc(100vh - 340px)' }) => (
  <div style={{ overflow: 'hidden' }}>
    <style>{`
      .admin-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
      .admin-scrollbar::-webkit-scrollbar-track { background: var(--a-bg5); }
      .admin-scrollbar::-webkit-scrollbar-thumb { background: var(--a-border3); border-radius: 10px; }
    `}</style>
    <div style={{ maxHeight, overflowY: 'auto', overflowX: 'auto' }} className="admin-scrollbar">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        {children}
      </table>
    </div>
  </div>
);

export const Pagination = ({ current, total, limit, onPageChange }) => {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '16px 0', borderTop: '1px solid var(--a-border)', background: 'var(--a-bg4)' }}>
      <button disabled={current === 1} onClick={() => onPageChange(current - 1)}
        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--a-border3)', background: 'transparent', color: current === 1 ? 'var(--a-faint)' : 'var(--a-subtle)', cursor: current === 1 ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600 }}>
        Prev
      </button>
      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)}
          style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid', borderColor: p === current ? '#ec4899' : 'var(--a-border3)', background: p === current ? 'rgba(236,72,153,0.1)' : 'transparent', color: p === current ? '#ec4899' : 'var(--a-muted)', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'all 0.15s' }}>
          {p}
        </button>
      ))}
      <button disabled={current === totalPages} onClick={() => onPageChange(current + 1)}
        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--a-border3)', background: 'transparent', color: current === totalPages ? 'var(--a-faint)' : 'var(--a-subtle)', cursor: current === totalPages ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600 }}>
        Next
      </button>
      <span style={{ marginLeft: 10, fontSize: 10, color: 'var(--a-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
        Page {current} of {totalPages}
      </span>
    </div>
  );
};

export const Tr = ({ children, onClick, style = {} }) => (
  <tr onClick={onClick} style={{ transition: 'background 0.1s', cursor: onClick ? 'pointer' : 'default', ...style }}
    onMouseEnter={e => { if (!style.opacity || style.opacity === 1) e.currentTarget.style.background = 'var(--a-hover)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
    {children}
  </tr>
);

export const Cover = ({ src, alt = '', size = 36, radius = 7, fallback }) => (
  <div style={{ width: size, height: size, borderRadius: radius, background: 'var(--a-border)', border: '1px solid var(--a-border2)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {src
      ? <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
      : fallback || null}
  </div>
);
