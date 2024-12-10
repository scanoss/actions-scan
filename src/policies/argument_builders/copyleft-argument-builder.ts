import { ArgumentBuilder } from './argument-builder';
import {
  COPYLEFT_LICENSE_EXCLUDE,
  COPYLEFT_LICENSE_EXPLICIT,
  COPYLEFT_LICENSE_INCLUDE,
  OUTPUT_FILEPATH,
  REPO_DIR,
  RUNTIME_CONTAINER
} from '../../app.input';
import * as core from '@actions/core';

export class CopyLeftArgumentBuilder extends ArgumentBuilder {
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

  async build(): Promise<string[]> {
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
}
