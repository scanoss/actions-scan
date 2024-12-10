import path from 'path';
import {
  COPYLEFT_LICENSE_EXCLUDE,
  COPYLEFT_LICENSE_EXPLICIT,
  COPYLEFT_LICENSE_INCLUDE,
  OUTPUT_FILEPATH,
  REPO_DIR
} from '../src/app.input';
import { CopyleftPolicyCheck } from '../src/policies/copyleft-policy-check';
import { CONCLUSION, PolicyCheck } from '../src/policies/policy-check';

// Mock the @actions/github module
jest.mock('@actions/github', () => ({
  context: {
    repo: { owner: 'mock-owner', repo: 'mock-repo' },
    serverUrl: 'github',
    runId: 12345678
    // Add other properties as needed
  },
  getOctokit: jest.fn().mockReturnValue({
    rest: {
      checks: {
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockReturnValue({
          data: {
            id: 1
          }
        })
      }
    }
  })
}));

describe('CopyleftPolicyCheck', () => {
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

  it('Copyleft policy check fail', async () => {
    const TEST_DIR = __dirname;
    const TEST_REPO_DIR = path.join(TEST_DIR, 'data');
    const TEST_RESULTS_FILE = 'results.json';

    (REPO_DIR as any) = TEST_REPO_DIR;
    (OUTPUT_FILEPATH as any) = TEST_RESULTS_FILE;

    jest.spyOn(CopyleftPolicyCheck.prototype, 'uploadArtifact').mockImplementation(async () => {
      return Promise.resolve({ id: 123456 });
    });
    jest.spyOn(CopyleftPolicyCheck.prototype, 'initStatus').mockImplementation();
    jest.spyOn(CopyleftPolicyCheck.prototype, 'updateCheck').mockImplementation();
    const copyleftPolicyCheck = new CopyleftPolicyCheck();
    await copyleftPolicyCheck.start(1);
    await copyleftPolicyCheck.run();
    //neutral cause policy policy halt on failure is not set
    expect(copyleftPolicyCheck.conclusion).toEqual(CONCLUSION.Neutral);
  }, 30000);

  it('Copyleft policy empty results', async () => {
    const TEST_DIR = __dirname;
    const TEST_REPO_DIR = path.join(TEST_DIR, 'data');
    const TEST_RESULTS_FILE = 'results.json';

    (REPO_DIR as any) = TEST_REPO_DIR;
    (OUTPUT_FILEPATH as any) = TEST_RESULTS_FILE;
    (COPYLEFT_LICENSE_EXCLUDE as any) = 'GPL-2.0-only';

    jest.spyOn(CopyleftPolicyCheck.prototype, 'uploadArtifact').mockImplementation(async () => {
      return Promise.resolve({ id: 123456 });
    });
    jest.spyOn(CopyleftPolicyCheck.prototype, 'initStatus').mockImplementation();
    jest.spyOn(CopyleftPolicyCheck.prototype, 'updateCheck').mockImplementation();
    const copyleftPolicyCheck = new CopyleftPolicyCheck();
    await copyleftPolicyCheck.start(1);
    await copyleftPolicyCheck.run();
    //neutral cause policy policy halt on failure is not set
    expect(copyleftPolicyCheck.conclusion).toEqual(CONCLUSION.Success);
  }, 30000);

  it('Copyleft policy explicit licenses', async () => {
    const TEST_DIR = __dirname;
    const TEST_REPO_DIR = path.join(TEST_DIR, 'data');
    const TEST_RESULTS_FILE = 'results.json';

    (REPO_DIR as any) = TEST_REPO_DIR;
    (OUTPUT_FILEPATH as any) = TEST_RESULTS_FILE;
    (COPYLEFT_LICENSE_EXPLICIT as any) = 'MIT,Apache-2.0';

    jest.spyOn(CopyleftPolicyCheck.prototype, 'uploadArtifact').mockImplementation(async () => {
      return Promise.resolve({ id: 123456 });
    });
    jest.spyOn(CopyleftPolicyCheck.prototype, 'initStatus').mockImplementation();
    jest.spyOn(CopyleftPolicyCheck.prototype, 'updateCheck').mockImplementation();
    const copyleftPolicyCheck = new CopyleftPolicyCheck();
    await copyleftPolicyCheck.start(1);
    await copyleftPolicyCheck.run();
    //neutral cause policy policy halt on failure is not set
    expect(copyleftPolicyCheck.conclusion).toEqual(CONCLUSION.Neutral);
  }, 30000);
});
