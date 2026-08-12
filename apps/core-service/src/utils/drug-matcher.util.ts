export interface DrugMatchCandidate {
    id: string;
    name: string;
    internationalName: string | null;
}

const DOSAGE_UNIT_PATTERN = /\b\d+([.,]\d+)?\s*(mg|mcg|g|ml|iu|xb|birlik|foiz|%)\b/gi;

export const normalizeDrugName = (raw: string): string => {
    return raw
        .toLowerCase()
        .trim()
        .replace(DOSAGE_UNIT_PATTERN, " ")
        .replace(/\s+/g, " ")
        .trim();
};

export const levenshteinDistance = (a: string, b: string): number => {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const matrix: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

    for (let i = 0; i < rows; i++) {
        matrix[i][0] = i;
    }
    for (let j = 0; j < cols; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i < rows; i++) {
        for (let j = 1; j < cols; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
        }
    }

    return matrix[rows - 1][cols - 1];
};

// TZ §3.2.4 "Levenshtein distance ≤ 2" — bu uzunlik bo'yicha nisbiy, lekin chegaralangan chegara.
// TZ'ning "Paracetamol/Paracitamol" (11 belgi) misolini aynan floor(11*0.2)=2 deb qaytaradi.
const getMaxDistance = (normalizedLength: number): number => {
    if (normalizedLength <= 4) {
        return 1;
    }
    if (normalizedLength <= 8) {
        return 2;
    }
    return Math.min(4, Math.floor(normalizedLength * 0.2));
};

export const findBestDrugMatch = (rawName: string, candidates: DrugMatchCandidate[]): string | null => {
    const normalizedRaw = normalizeDrugName(rawName);
    if (normalizedRaw.length < 3 || candidates.length === 0) {
        return null;
    }

    const maxDistance = getMaxDistance(normalizedRaw.length);
    let bestDistance = Infinity;
    let bestId: string | null = null;
    let bestCount = 0;

    for (const candidate of candidates) {
        const distances = [levenshteinDistance(normalizedRaw, normalizeDrugName(candidate.name))];
        if (candidate.internationalName) {
            distances.push(levenshteinDistance(normalizedRaw, normalizeDrugName(candidate.internationalName)));
        }
        const distance = Math.min(...distances);

        if (distance < bestDistance) {
            bestDistance = distance;
            bestId = candidate.id;
            bestCount = 1;
        } else if (distance === bestDistance) {
            bestCount++;
        }
    }

    if (bestDistance > maxDistance || bestCount !== 1) {
        return null;
    }

    return bestId;
};
