import { cx } from "@/lib/cx";
import { initials } from "@/lib/format";

const GRADIENTS = [
    ["#7B61FF", "#347FE7"],
    ["#19C9E8", "#347FE7"],
    ["#22A95A", "#19C9E8"],
    ["#E29A12", "#E5403C"],
    ["#E5403C", "#7B61FF"],
    ["#347FE7", "#22A95A"]
] as const;

// Bir xil ism doim bir xil rangda chiqadi
const gradientFor = (seed: string): string => {
    let h = 0;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const [a, b] = GRADIENTS[h % GRADIENTS.length];
    return `linear-gradient(135deg, ${a}, ${b})`;
};

export function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
    return (
        <div className={cx("avatar", size === "lg" && "avatar--lg")} style={{ background: gradientFor(name) }} aria-hidden="true">
            {initials(name)}
        </div>
    );
}
