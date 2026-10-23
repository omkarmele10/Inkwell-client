const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
export const SearchIcon = () => <svg {...base}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
export const BellIcon = () => <svg {...base} width="20" height="20"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10 21h4" /></svg>;
export const ThumbIcon = ({ down }) => <svg {...base} className={down ? 'flip' : undefined}><path d="M7 10v11H3V10zM7 10l4-8a3 3 0 0 1 3 3v4h6a2 2 0 0 1 2 2l-2 8a2 2 0 0 1-2 2H7" /></svg>;
export const SparkIcon = () => <svg {...base}><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" /></svg>;
export const ImageIcon = () => <svg {...base}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>;
