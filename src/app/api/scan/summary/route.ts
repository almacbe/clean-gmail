import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { makeGetScanSummaryUseCase } from '@/infrastructure/di/container';
import {
  AGE_THRESHOLDS,
  type AgeThreshold,
} from '@/domain/value-objects/AgeThreshold';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET! });

  if (!token || token.error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const olderThanParam = req.nextUrl.searchParams.get('olderThan') ?? '1y';

  if (!(AGE_THRESHOLDS as readonly string[]).includes(olderThanParam)) {
    return NextResponse.json(
      { error: 'Invalid olderThan parameter' },
      { status: 400 },
    );
  }

  const olderThan = olderThanParam as AgeThreshold;

  try {
    const useCase = makeGetScanSummaryUseCase();
    const output = await useCase.execute({
      accessToken: token.accessToken,
      olderThan,
    });
    return NextResponse.json(output, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch scan summary' },
      { status: 500 },
    );
  }
}
