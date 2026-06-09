import { describe, expect, it } from 'vitest';
import { normalizeDialogue } from '../../services/dialogueNormalizer';

describe('services/dialogueNormalizer.normalizeDialogue', () => {
  it('OpenAI: tool_calls -> tool_use parts; role: tool -> tool_result', () => {
    const raw = {
      model: 'gpt-4.1-mini',
      tools: [
        {
          type: 'function',
          function: {
            name: 'add',
            description: 'add',
            parameters: { type: 'object', properties: { a: { type: 'number' } } },
          },
        },
      ],
      messages: [
        { role: 'system', content: 'sys' },
        {
          role: 'assistant',
          content: 'calling',
          tool_calls: [
            { id: 'call_1', function: { name: 'add', arguments: '{"a":1}' } },
          ],
        },
        { role: 'tool', tool_call_id: 'call_1', content: '2' },
      ],
      usage: { prompt_tokens: 1, completion_tokens: 2 },
    };

    const norm = normalizeDialogue(raw);
    expect(norm?.provider).toBe('openai');
    expect(norm?.model).toBe('gpt-4.1-mini');
    expect(norm?.system?.[0]?.text).toBe('sys');
    expect(norm?.tools?.[0]?.name).toBe('add');

    const assistant = norm?.messages?.[0];
    expect(assistant?.role).toBe('assistant');
    expect(assistant?.content.some((p: any) => p.type === 'text' && p.text === 'calling')).toBe(true);
    const toolUse = assistant?.content.find((p: any) => p.type === 'tool_use');
    expect(toolUse).toMatchObject({ type: 'tool_use', id: 'call_1', name: 'add', input: { a: 1 } });

    const toolMsg = norm?.messages?.[1];
    expect(toolMsg?.role).toBe('tool');
    expect(toolMsg?.content?.[0]).toMatchObject({
      type: 'tool_result',
      tool_use_id: 'call_1',
      content: '2',
      is_error: false,
    });
  });

  it('Anthropic: content parts 归一化为对象；role 映射 user/tool/assistant', () => {
    const raw = {
      model: 'claude-3-5-sonnet',
      system: [{ type: 'text', text: 'sys' }],
      tools: [{ name: 't', description: 'd', input_schema: { type: 'object' } }],
      messages: [
        { role: 'user', content: ['hi', { type: 'text', text: 'there' }] },
        { role: 'assistant', content: [{ type: 'thinking', thinking: 'hmm' }] },
      ],
    };

    const norm = normalizeDialogue(raw);
    expect(norm?.provider).toBe('anthropic');
    expect(norm?.model).toBe('claude-3-5-sonnet');
    expect(norm?.system?.[0]).toMatchObject({ type: 'text', text: 'sys' });
    expect(norm?.tools?.[0]).toMatchObject({ name: 't' });

    const user = norm?.messages?.[0];
    expect(user?.role).toBe('user');
    expect(user?.content).toHaveLength(2);
    expect(user?.content?.[0]).toMatchObject({ type: 'text', text: 'hi' });
    expect(user?.content?.[1]).toMatchObject({ type: 'text', text: 'there' });
  });

  it('Claude Code 请求：thinking/tool_use/tool_result 正确归一化', () => {
    const raw = {
      model: 'deepseek-v4-flash',
      system: [{ type: 'text', text: 'sys' }],
      tools: [{ name: 'Edit', description: 'edit', input_schema: { type: 'object' } }],
      messages: [
        { role: 'user', content: [{ type: 'text', text: 'hi' }] },
        { role: 'system', content: 'tool output' },
        {
          role: 'assistant',
          content: [
            { type: 'thinking', thinking: 'plan', signature: 'sig' },
            { type: 'tool_use', id: 'call_1', name: 'Edit', input: { x: 1 } },
          ],
        },
        {
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: 'call_1', content: 'ok' }],
        },
      ],
    };

    const norm = normalizeDialogue(raw);
    expect(norm?.provider).toBe('anthropic');

    const assistant = norm?.messages?.[2];
    expect(assistant?.content.some((p: any) => p.type === 'thinking')).toBe(true);
    expect(assistant?.content.some((p: any) => p.type === 'tool_use')).toBe(true);

    const toolResultUser = norm?.messages?.[3];
    expect(toolResultUser?.content?.[0]).toMatchObject({
      type: 'tool_result',
      tool_use_id: 'call_1',
      content: 'ok',
    });
  });
});

