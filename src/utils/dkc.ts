import BN from "bn.js";

function get(value: string, shift: number, mask: string) {
  return new BN(mask, 16)
    .shln(shift)
    .and(new BN(value, 10))
    .shrn(shift)
    .toNumber();
}

export function getId(value: string) {
  return get(value, 64, "ffffffffffffffff");
}
