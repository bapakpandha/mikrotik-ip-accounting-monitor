// utils/formatBytes.ts
export function formatBytes(input: number, fractionDigits: number = 2): string {
    const kb = 1024;
    const mb = kb * 1024;
    const gb = mb * 1024;
    const tb = gb * 1024;

    if (input >= tb) {
        return (input / tb).toFixed(fractionDigits) + ' TiB';
    } else if (input >= gb) {
        return (input / gb).toFixed(fractionDigits) + ' GiB';
    } else if (input >= mb) {
        return (input / mb).toFixed(fractionDigits) + ' MiB';
    } else if (input >= kb) {
        return (input / kb).toFixed(fractionDigits) + ' KiB';
    } else {
        return input + ' B';
    }
}
