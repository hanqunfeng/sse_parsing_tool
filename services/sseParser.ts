
import { SSEEvent } from '../types';

const SSE_FIELD_PREFIXES = ['event:', 'data:', 'id:', 'retry:'];

const isSSEFieldLine = (line: string): boolean =>
  SSE_FIELD_PREFIXES.some((prefix) => line.startsWith(prefix));

const flushEvent = (currentEvent: Partial<SSEEvent>): SSEEvent | null => {
  if (!currentEvent.event && !currentEvent.data) return null;

  const data = currentEvent.data?.trim() ?? '';
  let parsedData: any = undefined;

  if (data === '[DONE]') {
    return {
      event: currentEvent.event || 'done',
      data,
      parsedData: undefined,
      timestamp: Date.now(),
      id: Math.random().toString(36).substring(7),
    };
  }

  if (data) {
    try {
      parsedData = JSON.parse(data);
    } catch {
      // Keep as string if not JSON
    }
  }

  return {
    event: currentEvent.event || 'message',
    data,
    parsedData,
    timestamp: Date.now(),
    id: Math.random().toString(36).substring(7),
  };
};

export const parseRawSSE = (rawText: string): SSEEvent[] => {
  const lines = rawText.split('\n');
  const events: SSEEvent[] = [];

  let currentEvent: Partial<SSEEvent> = {};
  let inDataPayload = false;
  let started = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!started && (line.startsWith('event:') || line.startsWith('data:'))) {
      started = true;
    }

    if (!started) continue;

    if (line === '') {
      const flushed = flushEvent(currentEvent);
      if (flushed) events.push(flushed);
      currentEvent = {};
      inDataPayload = false;
      continue;
    }

    if (line.startsWith('event:')) {
      currentEvent.event = line.replace('event:', '').trim();
      inDataPayload = false;
    } else if (line.startsWith('data:')) {
      const dataPart = line.replace('data:', '').trim();
      currentEvent.data = currentEvent.data ? `${currentEvent.data}\n${dataPart}` : dataPart;
      inDataPayload = true;
    } else if (line.startsWith('id:')) {
      currentEvent.id = line.replace('id:', '').trim();
      inDataPayload = false;
    } else if (inDataPayload) {
      currentEvent.data = `${currentEvent.data}\n${line}`;
    } else if (!isSSEFieldLine(line)) {
      // Continuation line without prior data: — treat as payload start
      currentEvent.data = line;
      inDataPayload = true;
    }
  }

  const flushed = flushEvent(currentEvent);
  if (flushed) events.push(flushed);

  return events;
};
