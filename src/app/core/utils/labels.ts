export function labelEnum(value?: string | null): string {
  if (!value) return 'Sin asignar';
  const lower = value.toLowerCase().replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function formatDate(value?: string | null): string {
  if (!value) return 'Sin fecha';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(date);
}

export function extractErrorMessage(error: unknown): string {
  const anyError = error as { error?: { message?: string }; message?: string };
  return anyError?.error?.message || anyError?.message || 'Ocurrió un error inesperado.';
}
