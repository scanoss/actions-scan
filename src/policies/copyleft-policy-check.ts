// SPDX-License-Identifier: MIT
/*
   Copyright (c) 2024, SCANOSS

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in
   all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
   THE SOFTWARE.
 */

import * as core from '@actions/core';
import { CHECK_NAME } from '../app.config';
import { PolicyCheck } from './policy-check';
import {
  COPYLEFT_LICENSE_EXCLUDE,
  COPYLEFT_LICENSE_EXPLICIT,
  COPYLEFT_LICENSE_INCLUDE,
  EXECUTABLE,
  OUTPUT_FILEPATH,
  REPO_DIR,
  RUNTIME_CONTAINER
} from '../app.input';
import * as exec from '@actions/exec';

/**
 * This class checks if any of the components identified in the scanner results are subject to copyleft licenses.
 * It filters components based on their licenses and looks for those with copyleft obligations.
 * It then generates a summary and detailed report of the findings.
 */
export class CopyleftPolicyCheck extends PolicyCheck {
  static policyName = 'Copyleft Policy';

  constructor() {
    super(`${CHECK_NAME}: ${CopyleftPolicyCheck.policyName}`);
  }

  private buildCopyleftArgs(): string[] {
    if (COPYLEFT_LICENSE_EXPLICIT) {
      core.info(`Explicit copyleft licenses: ${COPYLEFT_LICENSE_EXPLICIT}`);
      return ['--explicit', COPYLEFT_LICENSE_EXPLICIT];
    }

    if (COPYLEFT_LICENSE_INCLUDE) {
      core.info(`Included copyleft licenses: ${COPYLEFT_LICENSE_INCLUDE}`);
      return ['--include', COPYLEFT_LICENSE_INCLUDE];
    }

    if (COPYLEFT_LICENSE_EXCLUDE) {
      core.info(`Excluded copyleft licenses: ${COPYLEFT_LICENSE_EXCLUDE}`);
      return ['--exclude', COPYLEFT_LICENSE_EXCLUDE];
    }

    return [];
  }

  private buildArgs(): string[] {
    return [
      'run',
      '-v',
      `${REPO_DIR}:/scanoss`,
      RUNTIME_CONTAINER,
      'inspect',
      'copyleft',
      '--input',
      OUTPUT_FILEPATH,
      '--format',
      'md',
      ...this.buildCopyleftArgs()
    ];
  }

  async run(): Promise<void> {
    core.info(`Running Copyleft Policy Check...`);
    super.initStatus();
    const args = this.buildArgs();
    const options = {
      failOnStdErr: false,
      ignoreReturnCode: true
    };

    const { stdout, stderr, exitCode } = await exec.getExecOutput(EXECUTABLE, args, options);
    const summary = stdout;
    let details = stderr;
    if (exitCode === 1) {
      await this.success('### :white_check_mark: Policy Pass \n #### Not copyleft Licenses were found', undefined);
      return;
    }

    const { id } = await this.uploadArtifact(stdout);
    core.debug(`Copyleft Artifact ID: ${id}`);
    if (id) {
      details = await this.concatPolicyArtifactURLToPolicyCheck(stderr, id);
    }

    return this.reject(summary, details);
  }

  artifactPolicyFileName(): string {
    return 'policy-check-copyleft-results.md';
  }

  getPolicyName(): string {
    return CopyleftPolicyCheck.policyName;
  }
}
