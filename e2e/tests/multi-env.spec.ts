import { execSync } from 'child_process';

import {
  ensureNxProject,
  exists,
  runNxCommand,
  runNxCommandAsync,
  runPackageManagerInstall,
  tmpProjPath,
  updateFile,
} from '@nx/plugin/testing';

import { readRootPackageJson } from '@nx/devkit';
import { prepareRepo } from './support/prepareRepo';

describe('multi-env', () => {
  beforeAll(() => {
    prepareRepo();
  });

  // afterAll(() => {
  //   // Cleanup the test project, skipping for now
  //   // rmSync(tmpProjPath(), {
  //   //   recursive: true,
  //   //   force: true,
  //   // });
  // });

  it('should be installed', () => {
    // npm ls will fail if the package is not installed properly
    execSync('npm ls nx-multi-env', {
      cwd: tmpProjPath(),
      stdio: 'inherit',
    });
  });

  it('calls my plugin', async () => {
    const result = await runNxCommandAsync(`multi-env-run myapp`);
    console.log(result.stdout);
  });

  it('has no env', async () => {
    const result = await runNxCommandAsync(`serve myapp`);
    expect(result.stdout).toContain('Successfully ran target build');
  });
});
