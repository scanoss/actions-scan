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

import { DefaultArtifactClient } from '@actions/artifact';
import * as exec from '@actions/exec';
import * as inputs from '../app.input';
import { ScannerResults } from './result.interfaces';
import fs from 'fs';
import * as core from '@actions/core';
import * as path from 'path';
import {
  EXECUTABLE,
  OUTPUT_FILEPATH,
  SCAN_FILES,
  SCANOSS_SETTINGS,
  SETTINGS_FILE_PATH,
  SKIP_SNIPPETS
} from '../app.input';

const artifact = new DefaultArtifactClient();

export async function uploadResults(): Promise<void> {
  await artifact.uploadArtifact(
    path.basename(inputs.OUTPUT_FILEPATH),
    [inputs.OUTPUT_FILEPATH],
    path.dirname(inputs.OUTPUT_FILEPATH)
  );
}

export interface Options {
  /**
   * Whether SBOM ingestion is enabled. Optional.
   */
  sbomEnabled?: boolean;

  /**
   * Specifies the SBOM processing type: "identify" or "ignore". Optional.
   */
  sbomType?: string;

  /**
   * Absolute path to the SBOM file. Required if sbomEnabled is set to true.
   */
  sbomFilepath?: string;

  /**
   * Enables scanning for dependencies, utilizing scancode internally. Optional.
   */
  dependenciesEnabled?: boolean;

  /**
   * Gets dependencies with production scopes. optional
   */
  dependencyScope?: string;

  /**
   * List of custom dependency scopes to be included. optional
   */
  dependencyScopeInclude?: string;

  /**
   * List of custom dependency scopes to be excluded. optional
   */
  dependencyScopeExclude?: string;

  /**
   * Credentials for SCANOSS, enabling unlimited scans. Optional.
   */
  apiKey?: string;
  apiUrl?: string;

  /**
   * Absolute path where scan results are saved. Required.
   */
  outputFilepath: string;

  /**
   * Absolute path of the folder or file to scan. Required.
   */
  inputFilepath: string;

  /**
   * Runtime container to perform scan. Default [ghcr.io/scanoss/scanoss-py:v1.18.0]
   */
  runtimeContainer: string;

  /**
   * Skips snippet generation. Default [false]
   */
  skipSnippets: boolean;

  /**
   * Enables or disables file and snippet scanning. Default [true]
   */
  scanFiles: boolean;

  /**
   * Enables or disables SCANOSS settings. Default [false]
   */
  scanossSettings: boolean;

  /**
   * SCANOSS Settings file path. Default [scanoss.json]
   */
  settingsFilePath: string;
}

/**
 * `ScanService` is a class that wraps the `scanoss.py` Docker image, providing a simplified interface
 * for configuring and executing source code scans
 */
export class ScanService {
  private options: Options;
  private DEFAULT_SETTING_FILE_PATH = 'scanoss.json';
  constructor(options?: Options) {
    this.options = options || {
      sbomFilepath: inputs.SBOM_FILEPATH,
      sbomType: inputs.SBOM_TYPE,
      sbomEnabled: inputs.SBOM_ENABLED,
      apiKey: inputs.API_KEY,
      apiUrl: inputs.API_URL,
      dependenciesEnabled: inputs.DEPENDENCIES_ENABLED,
      outputFilepath: inputs.OUTPUT_FILEPATH,
      inputFilepath: inputs.REPO_DIR,
      dependencyScope: inputs.DEPENDENCIES_SCOPE,
      dependencyScopeInclude: inputs.DEPENDENCY_SCOPE_INCLUDE,
      dependencyScopeExclude: inputs.DEPENDENCY_SCOPE_EXCLUDE,
      runtimeContainer: inputs.RUNTIME_CONTAINER,
      skipSnippets: SKIP_SNIPPETS,
      scanFiles: SCAN_FILES,
      scanossSettings: SCANOSS_SETTINGS,
      settingsFilePath: SETTINGS_FILE_PATH
    };
  }
  async scan(): Promise<{ scan: ScannerResults; stdout: string; stderr: string }> {
    // Check for basic configuration before running the docker container
    this.checkBasicConfig();

    const options = {
      failOnStdErr: false,
      ignoreReturnCode: true
    };

    const args = await this.buildArgs();
    const { stdout, stderr } = await exec.getExecOutput(EXECUTABLE, args, options);

    const scan = await this.parseResult();
    return { scan, stdout, stderr };
  }

  /**
   * @brief Builds the dependency scope command string
   * @returns {Array<string>} The formatted dependency scope command
   *
   * @details
   * Handles three possible scope configurations:
   * - Dependency scope exclude
   * - Dependency scope include
   * - Dependency scope (prod/dev)
   *
   * @throws {Error} When multiple dependency scope filters are set
   *
   * @note Only one dependency scope filter can be set at a time
   */
  private dependencyScopeArgs(): string[] {
    const { dependencyScopeInclude, dependencyScopeExclude, dependencyScope } = this.options;

    // Count the number of non-empty values
    const setScopes = [dependencyScopeInclude, dependencyScopeExclude, dependencyScope].filter(
      scope => scope !== '' && scope !== undefined
    );

    if (setScopes.length > 1) {
      core.error('Only one dependency scope filter can be set');
    }

    if (dependencyScopeExclude && dependencyScopeExclude !== '') return ['--dep-scope-exc', dependencyScopeExclude];

    if (dependencyScopeInclude && dependencyScopeInclude !== '') return ['--dep-scope-inc', dependencyScopeInclude];

    if (dependencyScope && dependencyScope === 'prod') return ['--dep-scope', 'prod'];

    if (dependencyScope && dependencyScope === 'dev') return ['--dep-scope', 'dev'];

    return [];
  }

  /**
   * @brief Generates the snippet-related portion of the Docker command
   * @returns {Array<string>} The snippet command flag (-S) or empty string
   *
   * @details
   * Returns ["-S"] if snippets should be skipped, empty string otherwise
   */
  private buildSnippetArgs(): string[] {
    if (!this.options.skipSnippets) return [];
    return ['-S'];
  }

  /**
   * @brief Constructs the dependencies cmd
   * @returns {Array<string>} The formatted dependencies command
   *
   * @details
   * Combines dependency scanning options with scope commands.
   * Possible return values:
   * - [--dependencies-only, ${scopeCmd}]'
   * - [--dependencies, ${scopeCmd}]
   * - Empty array if no dependencies scanning is needed
   */
  private buildDependenciesArgs(): string[] {
    const dependencyScopeCmd = this.dependencyScopeArgs();
    if (!this.options.scanFiles && this.options.dependenciesEnabled) {
      return ['--dependencies-only', ...dependencyScopeCmd];
    } else if (this.options.dependenciesEnabled) {
      return ['--dependencies', ...dependencyScopeCmd];
    }
    return [];
  }

  /**
   * @brief Assembles the complete Docker command string
   * @returns {Promise<Array<string>>} The complete Docker command
   *
   * @details
   * Combines all command components:
   * - Docker run command with volume mounting
   * - Runtime container specification
   * - Scan command with output file
   * - Dependencies command
   * - SBOM detection
   * - Snippet command
   * - API configuration
   *
   */
  private async buildArgs(): Promise<string[]> {
    return [
      'run',
      '-v',
      `${this.options.inputFilepath}:/scanoss`,
      this.options.runtimeContainer,
      'scan',
      '.',
      '--output',
      `./${OUTPUT_FILEPATH}`,
      ...this.buildDependenciesArgs(),
      ...(await this.detectSBOM()),
      ...this.buildSnippetArgs(),
      ...(this.options.apiUrl ? ['--apiurl', this.options.apiUrl] : []),
      ...(this.options.apiKey ? ['--apiKey', this.options.apiKey.replace(/\n/gm, ' ')] : [])
    ];
  }

  /**
   * @brief Validates the basic configuration requirements for scanning
   *
   * @throws {Error} When no scan options are enabled
   *
   * @details
   * This method ensures that at least one of the following scan options is enabled:
   * - scanFiles: For scanning source code files
   * - dependenciesEnabled: For scanning project dependencies
   *
   */
  private checkBasicConfig(): void {
    if (!this.options.scanFiles && !this.options.dependenciesEnabled) {
      core.error(`At least one scan option should be enabled: [scanFiles, dependencyEnabled]`);
    }
    core.info("Scan basic config is valid");
  }

  /**
   * Constructs the command segment for SBOM ingestion based on the current configuration. This method checks if SBOM
   * ingestion is enabled and verifies the SBOM file's existence before constructing the command.
   *
   * @example
   * // When SBOM ingestion is enabled with a specified SBOM file and type:
   * // sbomEnabled = true, sbomFilepath = "/src/SBOM.json", sbomType = "identify"
   * // returns "--identify /src/SBOM.json"
   *
   * @returns A command string segment for SBOM ingestion or an empty string if conditions are not met.
   * @private
   */
  private async detectSBOM(): Promise<string[]> {
    // Overrides sbom file if is set
    if (this.options.scanossSettings) {
      try {
        await fs.promises.access(this.options.settingsFilePath, fs.constants.F_OK);
        return ['--settings', this.options.settingsFilePath];
      } catch (error: any) {
        if (this.options.settingsFilePath === this.DEFAULT_SETTING_FILE_PATH) return [];
        core.warning(`SCANOSS settings file not found at '${this.options.settingsFilePath}'. Please provide a valid
                     SCANOSS settings file path.`);
        return [];
      }
    }

    if (!this.options.sbomEnabled || !this.options.sbomFilepath) return [];

    try {
      await fs.promises.access(this.options.sbomFilepath, fs.constants.F_OK);
      return [`--${this.options.sbomType?.toLowerCase()}`, this.options.sbomFilepath];
    } catch (error: any) {
      core.error(error.message);
      return [];
    }
  }

  private async parseResult(): Promise<ScannerResults> {
    const content = await fs.promises.readFile(this.options.outputFilepath, 'utf-8');
    return JSON.parse(content) as ScannerResults;
  }
}

export const scanService = new ScanService();
