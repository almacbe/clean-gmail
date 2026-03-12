import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { makeScanPromotionsUseCase } from '@/infrastructure/di/container';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET! });

  if (!token || token.error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const useCase = makeScanPromotionsUseCase();
    const output = await useCase.execute(token.accessToken);
    return NextResponse.json(output, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to scan promotions' },
      { status: 500 },
    );
  }
}
