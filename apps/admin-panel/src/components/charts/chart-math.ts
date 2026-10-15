export type Point = [number, number];

/** Silliq egri chiziq (Catmull-Rom → Bezier); boshqaruv nuqtalari qo'shni nuqtalar orasida qisiladi — egri "oshib ketmaydi" */
export const smoothPath = (pts: Point[], tension = 0.18): string => {
    if (pts.length === 0) return "";
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i - 1] ?? pts[i];
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[i + 1];
        const [x3, y3] = pts[i + 2] ?? pts[i + 1];
        const lo = Math.min(y1, y2);
        const hi = Math.max(y1, y2);
        const c1y = Math.min(Math.max(y1 + (y2 - y0) * tension, lo), hi);
        const c2y = Math.min(Math.max(y2 - (y3 - y1) * tension, lo), hi);
        d += ` C${x1 + (x2 - x0) * tension},${c1y} ${x2 - (x3 - x1) * tension},${c2y} ${x2},${y2}`;
    }
    return d;
};

/** Y o'qi uchun "chiroyli" yuqori chegara; 4 ga bo'linadi — 5 ta belgi butun son bo'lishi uchun */
export const niceMax = (v: number): number => {
    if (v <= 4) return 4;
    const pow = 10 ** Math.floor(Math.log10(v));
    const n = v / pow;
    const nice = (n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
    return Math.ceil(nice / 4) * 4;
};

/** Aylana uzunligi 100 bo'lgan radius — dasharray qiymatlarini foizda berish uchun */
export const RING_RADIUS = 15.9155;
