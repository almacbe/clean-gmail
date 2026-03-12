import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import boundaries from 'eslint-plugin-boundaries';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        { type: 'domain', pattern: ['src/domain/**'], mode: 'full' },
        { type: 'application', pattern: ['src/application/**'], mode: 'full' },
        {
          type: 'infrastructure',
          pattern: ['src/infrastructure/**', 'src/app/api/**'],
          mode: 'full',
        },
        {
          type: 'presentation',
          pattern: ['src/presentation/**', 'src/app/**'],
          mode: 'full',
        },
        { type: 'shared', pattern: ['src/shared/**'], mode: 'full' },
      ],
      'boundaries/ignore': ['src/__tests__/**'],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: 'domain',
              allow: ['domain', 'shared'],
            },
            {
              from: 'application',
              allow: ['application', 'domain', 'shared'],
            },
            {
              from: 'infrastructure',
              allow: ['infrastructure', 'domain', 'application', 'shared'],
            },
            {
              from: 'presentation',
              allow: ['presentation', 'application', 'shared'],
            },
            {
              from: 'shared',
              allow: ['shared'],
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
