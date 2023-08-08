import { execSync } from 'child_process';

import { runNxCommandAsync, tmpProjPath } from '@nx/plugin/testing';
import { prepareRepo } from './support/prepareRepo';

describe('multi-env', () => {
  beforeAll(() => {
    prepareRepo();
  });

  it('checks the nx-multi-env package is installed', () => {
    // npm ls will fail if the package is not installed properly
    execSync('npm ls nx-multi-env', {
      cwd: tmpProjPath(),
      stdio: 'inherit',
    });
  });

  it('has no env', async () => {
    const result = await runNxCommandAsync(`multi-env-run myapp serve`);

    expect(result.stdout).toContain('LANGUAGE = undefined');
    expect(result.stdout).toContain('BUILD_ENV = undefined');
    expect(result.stdout).toContain('REGION = undefined');
    expect(result.stdout).toContain('LOCAL = 1'); // auto-loaded by nx from .local.env
    expect(result.stdout).toContain('Successfully ran target multi-env-run');
  });

  it('has extraEnvFiles', async () => {
    const result = await runNxCommandAsync(
      `multi-env-run myapp serve --extraEnvFiles=.prod.env,missingFile.env`
    );

    expect(result.stdout).toContain('LANGUAGE = undefined');
    expect(result.stdout).toContain('BUILD_ENV = prod');
    expect(result.stdout).toContain('REGION = undefined');
    expect(result.stdout).toContain('LOCAL = 1'); // auto-loaded by nx from .local.env
    expect(result.stdout).toContain('Successfully ran target multi-env-run');
  });

  it('has envChain', async () => {
    const result = await runNxCommandAsync(
      `multi-env-run myapp serve --envChain=dev`
    );

    expect(result.stdout).toContain('LANGUAGE = en');
    expect(result.stdout).toContain('BUILD_ENV = dev');
    expect(result.stdout).toContain('REGION = undefined');
    expect(result.stdout).toContain('LOCAL = 1'); // auto-loaded by nx from .local.env
    expect(result.stdout).toContain('Successfully ran target multi-env-run');
  });

  it('has both envChain and extraEnvFiles and the latter takes precedence', async () => {
    const result = await runNxCommandAsync(
      `multi-env-run myapp serve --envChain=dev --extraEnvFiles=missingFile.env,.prod.env`
    );

    expect(result.stdout).toContain('LANGUAGE = en');
    expect(result.stdout).toContain('BUILD_ENV = prod');
    expect(result.stdout).toContain('REGION = undefined');
    expect(result.stdout).toContain('LOCAL = 1'); // autoloaded by nx from .local.env
    expect(result.stdout).toContain('Successfully ran target multi-env-run');
  });

  it('has partial envChain', async () => {
    const result = await runNxCommandAsync(
      `multi-env-run myapp serve --envChain=local`
    );

    expect(result.stdout).toContain('LANGUAGE = en');
    expect(result.stdout).toContain('BUILD_ENV = undefined');
    expect(result.stdout).toContain('REGION = undefined');
    expect(result.stdout).toContain('LOCAL = 1');
    expect(result.stdout).toContain('Successfully ran target multi-env-run');
  });

  it('does not overrides ad-hoc env variables', async () => {
    const result = await runNxCommandAsync(
      `multi-env-run myapp serve --envChain=dev --extraEnvFiles=.prod.env`,
      { env: { NX_BUILD_ENV: 'stage' } }
    );

    expect(result.stdout).toContain('LANGUAGE = en');
    expect(result.stdout).toContain('BUILD_ENV = stage');
    expect(result.stdout).toContain('REGION = undefined');
    expect(result.stdout).toContain('LOCAL = 1');
    expect(result.stdout).toContain('Successfully ran target multi-env-run');
  });

  it('does not override standard env files', async () => {
    const result = await runNxCommandAsync(
      `multi-env-run myapp serve --envChain=dev --extraEnvFiles=.custom.env`
    );

    expect(result.stdout).toContain('LANGUAGE = en');
    expect(result.stdout).toContain('BUILD_ENV = dev');
    expect(result.stdout).toContain('REGION = undefined');
    expect(result.stdout).toContain('LOCAL = 1');
    expect(result.stdout).toContain('Successfully ran target multi-env-run');
  });
});
