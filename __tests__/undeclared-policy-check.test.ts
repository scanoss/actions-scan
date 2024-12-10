import { CONCLUSION, PolicyCheck } from '../src/policies/policy-check';
import { ScannerResults } from '../src/services/result.interfaces';
import { resultsMock } from './results.mock';
import { UndeclaredPolicyCheck } from '../src/policies/undeclared-policy-check';
import { OUTPUT_FILEPATH, REPO_DIR } from '../src/app.input';
import path from 'path';

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
        update: jest.fn().mockResolvedValue({})
      }
    }
  })
}));

describe('UndeclaredPolicyCheck', () => {
  let scannerResults: ScannerResults;
  let undeclaredPolicyCheck: UndeclaredPolicyCheck;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(UndeclaredPolicyCheck.prototype, 'uploadArtifact').mockImplementation(async () => {
      return Promise.resolve({ id: 123456 });
    });
    jest.spyOn(PolicyCheck.prototype, 'initStatus').mockImplementation();
    jest.spyOn(UndeclaredPolicyCheck.prototype, 'updateCheck').mockImplementation();

    scannerResults = JSON.parse(resultsMock[3].content);

    undeclaredPolicyCheck = new UndeclaredPolicyCheck();
  });

  it('should pass the policy check when undeclared components are not found', async () => {
    const TEST_DIR = __dirname;
    const TEST_REPO_DIR = path.join(TEST_DIR, 'data');
    const TEST_RESULTS_FILE = 'empty-results.json';

    // Set the required environment variables
    (REPO_DIR as any) = TEST_REPO_DIR;
    (OUTPUT_FILEPATH as any) = TEST_RESULTS_FILE;

    await undeclaredPolicyCheck.run();
    expect(undeclaredPolicyCheck.conclusion).toEqual(CONCLUSION.Success);
  });

  it('should fail the policy check when undeclared components are found', async () => {
    const TEST_DIR = __dirname;
    const TEST_REPO_DIR = path.join(TEST_DIR, 'data');
    const TEST_RESULTS_FILE = 'results.json';

    // Set the required environment variables
    (REPO_DIR as any) = TEST_REPO_DIR;
    (OUTPUT_FILEPATH as any) = TEST_RESULTS_FILE;

    await undeclaredPolicyCheck.run();
    expect(undeclaredPolicyCheck.conclusion).toEqual(CONCLUSION.Neutral);
  });
});
