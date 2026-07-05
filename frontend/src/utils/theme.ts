export function tooltipStyle(): React.CSSProperties {
  if (typeof window === 'undefined') return { backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f1f5f9' };
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#0f172a';
  const border = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#1e293b';
  const text = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#f1f5f9';
  return { backgroundColor: bg, borderColor: border, borderRadius: '12px', color: text };
}

export function tooltipLabelStyle(): React.CSSProperties {
  return { color: '#94a3b8', fontWeight: 600 };
}
