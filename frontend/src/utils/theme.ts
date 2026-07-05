export function tooltipStyle(): React.CSSProperties {
  if (typeof window === 'undefined') return { backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' };
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#0f172a';
  const border = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#1e293b';
  return { backgroundColor: bg, borderColor: border, borderRadius: '12px' };
}

export function tooltipLabelStyle(): React.CSSProperties {
  return { color: '#94a3b8', fontWeight: 600 };
}
