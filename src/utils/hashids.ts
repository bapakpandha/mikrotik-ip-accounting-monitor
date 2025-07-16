import Hashids from 'hashids'

const salt = 'ip-accounting'
const hashids = new Hashids(salt, 6)

export function encodeId(id: number): string {
  return hashids.encode(id)
}

export function decodeId(hash: string): number | null {
  const decoded = hashids.decode(hash)
  return decoded.length ? Number(decoded[0]) : null
}
