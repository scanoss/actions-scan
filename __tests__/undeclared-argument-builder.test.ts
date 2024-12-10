import { OUTPUT_FILEPATH, REPO_DIR, RUNTIME_CONTAINER, SCANOSS_SETTINGS } from '../src/app.input';
import { UndeclaredArgumentBuilder } from '../src/policies/argument_builders/undeclared-argument-builder';

describe('UndeclaredArgumentBuilder', () => {
  it('Build Command test', async function () {
    (REPO_DIR as any) = 'repodir';
    (OUTPUT_FILEPATH as any) = 'results.json';
    const builder = new UndeclaredArgumentBuilder();
    const cmd = await builder.build();
    expect(cmd).toEqual([
      'run',
      '-v',
      'repodir:/scanoss',
      RUNTIME_CONTAINER,
      'inspect',
      'undeclared',
      '--input',
      'results.json',
      '--format',
      'md',
      '--sbom-format',
      'legacy'
    ]);
  });

  it('Build Command style scanoss.json', async function () {
    (REPO_DIR as any) = 'repodir';
    (OUTPUT_FILEPATH as any) = 'results.json';
    (SCANOSS_SETTINGS as any) = true;
    const builder = new UndeclaredArgumentBuilder();
    const cmd = await builder.build();
    expect(cmd).toEqual([
      'run',
      '-v',
      'repodir:/scanoss',
      RUNTIME_CONTAINER,
      'inspect',
      'undeclared',
      '--input',
      'results.json',
      '--format',
      'md'
    ]);
  });
});
