import React, { useMemo, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { SSEEvent } from '../types';

interface EventListProps {
  events: SSEEvent[];
}

const getEventLabel = (event: SSEEvent): string => {
  if (event.parsedData?.object === 'chat.completion.chunk') return 'chunk';
  if (event.event === 'done') return 'done';
  return event.event;
};

const getEventColor = (name: string) => {
  switch (name) {
    case 'message_start': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'content_block_start': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'content_block_delta': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'content_block_stop': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'message_stop': return 'bg-red-100 text-red-700 border-red-200';
    case 'chunk': return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'done': return 'bg-gray-100 text-gray-500 border-gray-200';
    case 'ping': return 'bg-gray-100 text-gray-500 border-gray-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const EventList: React.FC<EventListProps> = ({ events }) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const eventTypes = useMemo(() => {
    const labels = new Set<string>();
    events.forEach((ev) => labels.add(getEventLabel(ev)));
    return Array.from(labels).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((ev) => {
      const label = getEventLabel(ev);
      if (typeFilter !== 'all' && label !== typeFilter) return false;
      if (!q) return true;
      return label.toLowerCase().includes(q) || ev.data.toLowerCase().includes(q);
    });
  }, [events, query, typeFilter]);

  const selectedEvent = useMemo(
    () => (selectedId ? filteredEvents.find((e) => e.id === selectedId) ?? null : null),
    [filteredEvents, selectedId]
  );

  const itemHeight = 44;
  const listHeight = 320;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
          Event Sequence ({filteredEvents.length}{filteredEvents.length !== events.length ? ` / ${events.length}` : ''})
        </span>

        <div className="flex items-center gap-2 min-w-0">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-32 md:w-40 px-2 py-1 text-xs bg-white rounded-md border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none mono"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2 py-1 text-xs bg-white rounded-md border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">All</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setQuery('');
              setTypeFilter('all');
            }}
            className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-md border border-slate-200"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white">
        <List
          height={listHeight}
          itemCount={filteredEvents.length}
          itemSize={itemHeight}
          width="100%"
          itemKey={(index) => filteredEvents[index]?.id ?? index}
        >
          {({ index, style }) => {
            const ev = filteredEvents[index];
            const label = getEventLabel(ev);
            const isSelected = ev.id === selectedId;

            return (
              <button
                type="button"
                onClick={() => setSelectedId(ev.id)}
                style={style}
                className={`w-full flex items-center gap-3 px-4 border-b border-slate-200 last:border-0 text-left hover:bg-slate-50 transition-colors ${
                  isSelected ? 'bg-indigo-50' : ''
                }`}
              >
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getEventColor(label)}`}>
                  {label}
                </span>
                <span className="flex-1 text-xs text-slate-600 truncate mono">
                  {ev.data.substring(0, 120)}{ev.data.length > 120 ? '...' : ''}
                </span>
              </button>
            );
          }}
        </List>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 p-4 overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Event Detail
          </div>
          <button
            onClick={() => setSelectedId(null)}
            className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md border border-slate-200"
            disabled={!selectedEvent}
          >
            Clear Selection
          </button>
        </div>

        {selectedEvent ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getEventColor(getEventLabel(selectedEvent))}`}>
                {getEventLabel(selectedEvent)}
              </span>
              <span className="text-[10px] text-slate-400 mono truncate">
                {new Date(selectedEvent.timestamp).toISOString()}
              </span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg overflow-x-auto max-h-48">
              <pre className="text-[11px] text-emerald-400 mono whitespace-pre-wrap">
                {JSON.stringify(selectedEvent.parsedData || selectedEvent.data, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">
            Click an event above to view details.
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;

