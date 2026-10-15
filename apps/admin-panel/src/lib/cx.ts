/** Shartli CSS klasslarini birlashtiradi: cx("btn", active && "is-active") */
export const cx = (...classes: (string | false | null | undefined)[]): string => classes.filter(Boolean).join(" ");
