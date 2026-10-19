import { BROADCAST_LABELS } from '@/lib/tv/broadcasts';
type Status = keyof typeof BROADCAST_LABELS;
export function BroadcastStatusSelect({ value, onChange }: { value: Status; onChange: (value: Status) => void }) {
  return <select aria-label="Estado de retransmisión" className="input mt-1" value={value} onChange={event => onChange(event.target.value as Status)}>{Object.entries(BROADCAST_LABELS).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select>;
}