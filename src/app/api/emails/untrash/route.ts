import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { makeUntrashEmailsUseCase } from '@/infrastructure/di/container';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET! });

  if (!token || token.error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let ids: unknown;
  try {
    const body = (await req.json()) as unknown;
    ids = (body as { ids?: unknown }).ids;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    );
  }

  if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) {
    return NextResponse.json(
      { error: 'ids must be an array of strings' },
      { status: 400 },
    );
  }

  try {
    const useCase = makeUntrashEmailsUseCase();
    const output = await useCase.execute({
      ids: ids as string[],
      accessToken: token.accessToken,
    });
    return NextResponse.json(output, { status: 200 });
  } catch (err) {
    const code =
      err !== null && typeof err === 'object' && 'code' in err
        ? (err as { code: unknown }).code
        : undefined;
    const status =
      err !== null && typeof err === 'object' && 'status' in err
        ? (err as { status: unknown }).status
        : undefined;

    if (code === 403 || status === 403) {
      return NextResponse.json(
        { error: 'insufficient_scope' },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to untrash emails' },
      { status: 500 },
    );
  }
}
