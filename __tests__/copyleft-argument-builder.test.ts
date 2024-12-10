import {
  COPYLEFT_LICENSE_EXCLUDE,
  COPYLEFT_LICENSE_EXPLICIT,
  COPYLEFT_LICENSE_INCLUDE,
  OUTPUT_FILEPATH,
  REPO_DIR,
  RUNTIME_CONTAINER
} from '../src/app.input';
import { CopyLeftArgumentBuilder } from '../src/policies/argument_builders/copyleft-argument-builder';

describe('CopyleftArgumentBuilder', () => {
  const defaultCopyleftLicenseExplicit = COPYLEFT_LICENSE_EXPLICIT;
  const defaultCopyleftLicenseExclude = COPYLEFT_LICENSE_EXCLUDE;
  const defaultCopyleftLicenseInclude = COPYLEFT_LICENSE_INCLUDE;

  afterEach(() => {
    // Restore all mocks
    jest.restoreAllMocks();
    (COPYLEFT_LICENSE_EXPLICIT as any) = defaultCopyleftLicenseExplicit;
    (COPYLEFT_LICENSE_EXCLUDE as any) = defaultCopyleftLicenseExclude;
    (COPYLEFT_LICENSE_INCLUDE as any) = defaultCopyleftLicenseInclude;
  });

  test('Copyleft explicit test', async () => {
    (COPYLEFT_LICENSE_EXPLICIT as any) = 'MIT,Apache-2.0';
    (COPYLEFT_LICENSE_EXCLUDE as any) = 'MIT,Apache-2.0';
    (REPO_DIR as any) = 'scanoss';
    (OUTPUT_FILEPATH as any) = 'results.json';

    const builder = new CopyLeftArgumentBuilder();
    const cmd = await builder.build();
    expect(cmd).toEqual([
      'run',
      '-v',
      'scanoss:/scanoss',
      'ghcr.io/scanoss/scanoss-py:v1.18.0',
      'inspect',
      'copyleft',
      '--input',
      'results.json',
      '--format',
      'md',
      '--explicit',
      'MIT,Apache-2.0'
    ]);
  });

  test('Copyleft exclude test', async () => {
    (COPYLEFT_LICENSE_EXCLUDE as any) = 'MIT,Apache-2.0';
    (REPO_DIR as any) = 'scanoss';
    (OUTPUT_FILEPATH as any) = 'results.json';
    const builder = new CopyLeftArgumentBuilder();
    const cmd = await builder.build();
    expect(cmd).toEqual([
      'run',
      '-v',
      'scanoss:/scanoss',
      'ghcr.io/scanoss/scanoss-py:v1.18.0',
      'inspect',
      'copyleft',
      '--input',
      'results.json',
      '--format',
      'md',
      '--exclude',
      'MIT,Apache-2.0'
    ]);
  });

  test('Copyleft include test', async () => {
    (COPYLEFT_LICENSE_INCLUDE as any) = 'MIT,Apache-2.0,LGPL-3.0-only';
    (REPO_DIR as any) = 'scanoss';
    (OUTPUT_FILEPATH as any) = 'results.json';
    const builder = new CopyLeftArgumentBuilder();
    const cmd = await builder.build();
    expect(cmd).toEqual([
      'run',
      '-v',
      'scanoss:/scanoss',
      'ghcr.io/scanoss/scanoss-py:v1.18.0',
      'inspect',
      'copyleft',
      '--input',
      'results.json',
      '--format',
      'md',
      '--include',
      'MIT,Apache-2.0,LGPL-3.0-only'
    ]);
  });

  test('Copyleft empty parameters test', async () => {
    (REPO_DIR as any) = 'scanoss';
    (OUTPUT_FILEPATH as any) = 'results.json';
    const builder = new CopyLeftArgumentBuilder();
    const cmd = await builder.build();
    expect(cmd).toEqual([
      'run',
      '-v',
      'scanoss:/scanoss',
      RUNTIME_CONTAINER,
      'inspect',
      'copyleft',
      '--input',
      'results.json',
      '--format',
      'md'
    ]);
  });

  test('Build Command test', async () => {
    (REPO_DIR as any) = 'scanoss';
    (OUTPUT_FILEPATH as any) = 'results.json';
    const builder = new CopyLeftArgumentBuilder();
    const cmd = await builder.build();
    expect(cmd).toEqual([
      'run',
      '-v',
      'scanoss:/scanoss',
      RUNTIME_CONTAINER,
      'inspect',
      'copyleft',
      '--input',
      'results.json',
      '--format',
      'md'
    ]);
  });
});
