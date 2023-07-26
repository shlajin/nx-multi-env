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

describe('multi-env', () => {
  beforeAll(() => {
    if (exists(tmpProjPath('package.json'))) {
      console.log('Skipping for faster tests...');
      return;
    }
    console.time('beforeAll');
    ensureNxProject('nx-multi-env', 'dist/nx-multi-env');

    updateFile('package.json', (originalFileContent) => {
      const parsedPackage = JSON.parse(originalFileContent);
      const nxVersion = readRootPackageJson().devDependencies.nx;
      parsedPackage.devDependencies['@nx/node'] = nxVersion;
      return JSON.stringify(parsedPackage, undefined, 2);
    });

    runPackageManagerInstall();

    runNxCommand(
      'generate @nx/node:app myapp --framework=none --e2e-test-runner=none --no-interactive'
    );

    // Make the `serve` command quit without rebuilding
    updateFile('apps/myapp/project.json', (originalFileContent) => {
      const json = JSON.parse(originalFileContent);
      json.targets.serve.options.watch = false;
      json.targets['multi-env-run'] = {
        executor: 'nx-multi-env:run',
      };
      return JSON.stringify(json, undefined, 2);
    });

    // serve myapp will print these values
    updateFile(
      'apps/myapp/src/main.ts',
      `
      console.log('LANGUAGE = ' + process.env.NX_LANGUAGE);
      console.log('BUILD_ENV = ' + process.env.NX_BUILD_ENV);
      console.log('REGION = ' + process.env.NX_REGION);
    `
    );

    console.timeEnd('beforeAll');
  });

  afterAll(() => {
    // Cleanup the test project, skipping for now
    // rmSync(tmpProjPath(), {
    //   recursive: true,
    //   force: true,
    // });
  });

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
