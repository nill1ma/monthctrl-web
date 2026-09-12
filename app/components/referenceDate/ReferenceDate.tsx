export default function ReferenceDate({ reference, format = 'long' }: { reference: string; format?: 'long' | 'short' }) {
  const [year, month] = reference.split('-');
  return new Date(`${year}-${Number(month)}`).toLocaleString('default', {
    month: format,
    year: 'numeric',
  });
}