import { OUTPUT_FILEPATH, RUNTIME_CONTAINER } from '../src/app.input';
import { ScanService } from '../src/services/scan.service';
import fs from 'fs';
import path from 'path';

describe('ScanService', () => {
  it('should correctly return the dependency scope command', () => {
    const service = new ScanService({
      outputFilepath: '',
      inputFilepath: '',
      runtimeContainer: RUNTIME_CONTAINER,
      dependencyScope: 'prod',
      dependencyScopeInclude: '',
      dependencyScopeExclude: '',
      scanFiles: true,
      skipSnippets: false,
      settingsFilePath: '',
      scanossSettings: false
    });

    // Accessing the private method by bypassing TypeScript type checks
    const command = (service as any).dependencyScopeArgs();
    console.log(command);
    expect(command).toEqual(['--dep-scope', 'prod']);
  });

  it('Should return --dependencies-only parameter', () => {
    const service = new ScanService({
      outputFilepath: '',
      inputFilepath: '',
      runtimeContainer: RUNTIME_CONTAINER,
      dependencyScope: '',
      dependencyScopeInclude: '',
      dependencyScopeExclude: '',
      dependenciesEnabled: true,
      scanFiles: false,
      skipSnippets: false,
      settingsFilePath: '',
      scanossSettings: false
    });

    const command = (service as any).buildDependenciesArgs();
    expect(command).toEqual(['--dependencies-only']);
  });

  it('Should return dependencies parameter', () => {
    const service = new ScanService({
      outputFilepath: '',
      inputFilepath: '',
      runtimeContainer: RUNTIME_CONTAINER,
      dependencyScope: '',
      dependencyScopeInclude: '',
      dependencyScopeExclude: '',
      dependenciesEnabled: true,
      scanFiles: true,
      skipSnippets: false,
      settingsFilePath: '',
      scanossSettings: false
    });

    const command = (service as any).buildDependenciesArgs();
    expect(command).toEqual(['--dependencies']);
  });

  it('Should return skip snippet parameter', () => {
    const service = new ScanService({
      outputFilepath: '',
      inputFilepath: '',
      runtimeContainer: RUNTIME_CONTAINER,
      dependencyScope: '',
      dependencyScopeInclude: '',
      dependencyScopeExclude: '',
      dependenciesEnabled: true,
      scanFiles: true,
      skipSnippets: true,
      settingsFilePath: '',
      scanossSettings: false
    });

    const command = (service as any).buildSnippetArgs();
    expect(command).toEqual(['-S']);
  });

  it('Should return a command with skip snippet and prod dependencies', async () => {
    const service = new ScanService({
      outputFilepath: 'results.json',
      inputFilepath: 'inputFilepath',
      runtimeContainer: RUNTIME_CONTAINER,
      dependencyScope: 'prod',
      dependencyScopeInclude: '',
      dependencyScopeExclude: '',
      dependenciesEnabled: true,
      scanFiles: true,
      skipSnippets: true,
      settingsFilePath: '',
      scanossSettings: false
    });

    const command = await (service as any).buildArgs();
    console.log(command);
    expect(command).not.toBe('');
  });

  it('Should scan dependencies', async () => {
    (OUTPUT_FILEPATH as any) = 'test-results.json';
    const TEST_DIR = __dirname;
    const resultPath = path.join(TEST_DIR, 'data', 'test-results.json');
    const service = new ScanService({
      outputFilepath: resultPath,
      inputFilepath: path.join(TEST_DIR, 'data'),
      runtimeContainer: RUNTIME_CONTAINER,
      dependencyScopeInclude: '',
      dependencyScopeExclude: '',
      dependenciesEnabled: true,
      sbomEnabled: false,
      scanFiles: true,
      skipSnippets: false,
      settingsFilePath: 'scanoss.json',
      scanossSettings: false
    });

    const { scan } = await service.scan();
    expect(scan['package.json'][0].dependencies.length).toBeGreaterThan(0);
    await fs.promises.rm(resultPath);
  }, 30000);
});
