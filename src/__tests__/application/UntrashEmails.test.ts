import { describe, expect, it, vi } from 'vitest';
import { UntrashEmails } from '@/application/use-cases/UntrashEmails';
import type { EmailUntrash } from '@/domain/repositories/EmailUntrash';

function makeMockUntrash(
  impl?: () => Promise<void>,
): EmailUntrash & { untrash: ReturnType<typeof vi.fn> } {
  return {
    untrash: vi.fn(impl ?? (() => Promise.resolve())),
  };
}

describe('UntrashEmails', () => {
  it('returns untrashedCount 0 and does not call adapter when ids is empty', async () => {
    const untrash = makeMockUntrash();
    const useCase = new UntrashEmails(untrash);

    const output = await useCase.execute({ ids: [], accessToken: 'tok' });

    expect(output.untrashedCount).toBe(0);
    expect(untrash.untrash).not.toHaveBeenCalled();
  });

  it('calls adapter with ids and token and returns correct untrashedCount', async () => {
    const untrash = makeMockUntrash();
    const useCase = new UntrashEmails(untrash);

    const output = await useCase.execute({
      ids: ['id1'],
      accessToken: 'tok',
    });

    expect(untrash.untrash).toHaveBeenCalledWith(['id1'], 'tok');
    expect(output.untrashedCount).toBe(1);
  });

  it('returns untrashedCount equal to number of ids provided', async () => {
    const untrash = makeMockUntrash();
    const useCase = new UntrashEmails(untrash);

    const ids = ['a', 'b', 'c'];
    const output = await useCase.execute({ ids, accessToken: 'tok' });

    expect(output.untrashedCount).toBe(3);
    expect(untrash.untrash).toHaveBeenCalledOnce();
  });

  it('propagates adapter errors to the caller', async () => {
    const untrash = makeMockUntrash(() =>
      Promise.reject(new Error('API error')),
    );
    const useCase = new UntrashEmails(untrash);

    await expect(
      useCase.execute({ ids: ['id1'], accessToken: 'tok' }),
    ).rejects.toThrow('API error');
  });
});
