import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { parseRawSSE } from '../../services/sseParser';

describe('services/sseParser.parseRawSSE', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('跳过 HTTP 头直到遇到 event/data', () => {
    const raw = [
      'HTTP/1.1 200 OK',
      'content-type: text/event-stream',
      '',
      'data: {"a":1}',
      '',
    ].join('\n');

    const events = parseRawSSE(raw);
    expect(events).toHaveLength(1);
    expect(events[0].data).toBe('{"a":1}');
    expect(events[0].parsedData).toEqual({ a: 1 });
  });

  it('多行 data: 会用 \\n 拼接并 JSON 解析', () => {
    const raw = [
      'event: message',
      'data: {"a": 1,',
      'data: "b": 2}',
      '',
    ].join('\n');

    const events = parseRawSSE(raw);
    expect(events).toHaveLength(1);
    expect(events[0].data).toBe('{"a": 1,\n"b": 2}');
    expect(events[0].parsedData).toEqual({ a: 1, b: 2 });
  });

  it('[DONE] 会生成 done 事件且 parsedData 为 undefined', () => {
    const raw = ['data: [DONE]', ''].join('\n');
    const events = parseRawSSE(raw);
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('done');
    expect(events[0].data).toBe('[DONE]');
    expect(events[0].parsedData).toBeUndefined();
  });

  it('空行会 flush 当前事件', () => {
    const raw = ['data: {"n":1}', '', 'data: {"n":2}', ''].join('\n');
    const events = parseRawSSE(raw);
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.parsedData)).toEqual([{ n: 1 }, { n: 2 }]);
  });

  it('data: 后续的 continuation 行会加入 payload', () => {
    const raw = ['data: hello', 'world', '', 'data: ok', ''].join('\n');
    const events = parseRawSSE(raw);
    expect(events).toHaveLength(2);
    expect(events[0].data).toBe('hello\nworld');
    expect(events[0].parsedData).toBeUndefined();
  });
});

