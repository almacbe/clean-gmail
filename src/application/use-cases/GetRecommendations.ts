import type { GetRecommendationsInput } from '@/application/dtos/GetRecommendationsInput';
import type {
  GetRecommendationsOutput,
  RecommendationDto,
} from '@/application/dtos/GetRecommendationsOutput';
import type { EmailMetadataDto } from '@/application/dtos/ScanLargeEmailsOutput';

const CATEGORIES: Array<{
  key: keyof GetRecommendationsInput;
  label: string;
}> = [
  { key: 'largeEmails', label: 'Large Emails' },
  { key: 'promotions', label: 'Promotions' },
  { key: 'social', label: 'Social' },
  { key: 'oldEmails', label: 'Old Emails' },
];

export class GetRecommendations {
  execute(input: GetRecommendationsInput): GetRecommendationsOutput {
    const recommendations: RecommendationDto[] = [];

    for (const { key, label } of CATEGORIES) {
      const emails = input[key] as readonly EmailMetadataDto[];
      if (emails.length === 0) continue;

      const totalSizeBytes = emails.reduce(
        (sum, email) => sum + email.sizeEstimate,
        0,
      );

      recommendations.push({
        category: label,
        emailCount: emails.length,
        totalSizeBytes,
      });
    }

    recommendations.sort((a, b) => b.totalSizeBytes - a.totalSizeBytes);

    return { recommendations };
  }
}
