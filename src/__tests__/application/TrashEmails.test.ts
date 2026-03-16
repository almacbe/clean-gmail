import { describe, expect, it, vi } from 'vitest';
import { TrashEmails } from '@/application/use-cases/TrashEmails';
import type { EmailDeleter } from '@/domain/repositories/EmailDeleter';

function makeMockDeleter(
  impl?: () => Promise<void>,
): EmailDeleter & { trash: ReturnType<typeof vi.fn> } {
  return {
    trash: vi.fn(impl ?? (() => Promise.resolve())),
  };
}

describe('TrashEmails', () => {
  it('returns trashedCount 0 and does not call adapter when ids is empty', async () => {
    const deleter = makeMockDeleter();
    const useCase = new TrashEmails(deleter);

    const output = await useCase.execute({ ids: [], accessToken: 'tok' });

    expect(output.trashedCount).toBe(0);
    expect(deleter.trash).not.toHaveBeenCalled();
  });

  it('calls adapter with ids and token and returns correct trashedCount', async () => {
    const deleter = makeMockDeleter();
    const useCase = new TrashEmails(deleter);

    const output = await useCase.execute({
      ids: ['id1'],
      accessToken: 'tok',
    });

    expect(deleter.trash).toHaveBeenCalledWith(['id1'], 'tok');
    expect(output.trashedCount).toBe(1);
  });

  it('returns trashedCount equal to number of ids provided', async () => {
    const deleter = makeMockDeleter();
    const useCase = new TrashEmails(deleter);

    const ids = ['a', 'b', 'c'];
    const output = await useCase.execute({ ids, accessToken: 'tok' });

    expect(output.trashedCount).toBe(3);
    expect(deleter.trash).toHaveBeenCalledOnce();
  });

  it('propagates adapter errors to the caller', async () => {
    const deleter = makeMockDeleter(() =>
      Promise.reject(new Error('API error')),
    );
    const useCase = new TrashEmails(deleter);

    await expect(
      useCase.execute({ ids: ['id1'], accessToken: 'tok' }),
    ).rejects.toThrow('API error');
  });
});
