import { CONCLUSION, PolicyCheck } from '../src/policies/policy-check';
import { ScannerResults } from '../src/services/result.interfaces';
import * as github from '@actions/github';
import { resultsMock } from './results.mock';
import { UndeclaredPolicyCheck } from '../src/policies/undeclared-policy-check';
import * as sbomUtils from '../src/utils/sbom.utils';
import { sbomMock } from './sbom.mock';

describe('UndeclaredPolicyCheck', () => {
  let scannerResults: ScannerResults;
  let undeclaredPolicyCheck: UndeclaredPolicyCheck;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(github, 'getOctokit').mockImplementation();

    jest.spyOn(PolicyCheck.prototype, 'run').mockImplementation();
    jest.spyOn(PolicyCheck.prototype, 'updateCheck').mockImplementation();

    scannerResults = JSON.parse(resultsMock[3].content);

    undeclaredPolicyCheck = new UndeclaredPolicyCheck();
  });

  it('should pass the policy check when undeclared components are not found', async () => {
    jest.spyOn(sbomUtils, 'parseSBOM').mockImplementation(async () => Promise.resolve(sbomMock[1]));

    await undeclaredPolicyCheck.run(scannerResults);
    expect(undeclaredPolicyCheck.conclusion).toEqual(CONCLUSION.Success);
  });

  it('should fail the policy check when undeclared components are found', async () => {
    jest.spyOn(sbomUtils, 'parseSBOM').mockImplementation(async () => Promise.resolve(sbomMock[0]));

    await undeclaredPolicyCheck.run(scannerResults);
    expect(undeclaredPolicyCheck.conclusion).toEqual(CONCLUSION.Neutral);
  });

  it('should exceeded the max limit', async () => {
    jest.spyOn(sbomUtils, 'parseSBOM').mockImplementation(async () => Promise.resolve(sbomMock[0]));
    scannerResults = JSON.parse(resultsMock[6].content);
    await undeclaredPolicyCheck.run(scannerResults);
    // Neutral = Failure on test environment
    expect(undeclaredPolicyCheck.conclusion).toEqual(CONCLUSION.Neutral);
  });
});
