/** Valida CPF (11 dígitos com dígitos verificadores). Recebe só dígitos. */
export function isValidCpf(value: string): boolean {
  const cpf = value.replace(/\D/g, '')
  if (cpf.length !== 11) return false
  // rejeita sequências repetidas (111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const digit = (slice: number, weightStart: number) => {
    let sum = 0
    for (let i = 0; i < slice; i++) {
      sum += Number(cpf[i]) * (weightStart - i)
    }
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }

  return digit(9, 10) === Number(cpf[9]) && digit(10, 11) === Number(cpf[10])
}

/** Máscara visual 000.000.000-00 */
export function maskCpf(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}
