import { runNxCommandAsync } from '@nx/plugin/testing';
import { prepareRepo } from './support/prepareRepo';

describe('print-env', () => {
  const noNxColors = {
    env: {
      FORCE_COLOR: 'false',
    },
  };

  beforeAll(() => {
    prepareRepo();
  });

  it('prints the empty env if nothing is specified', async () => {
    const result = await runNxCommandAsync(`multi-env-print myapp`, noNxColors);
    expect(result.stdout).toMatch(/No extra envFiles provided/);
    expect(result.stdout).toMatch('No envChain provided');
    expect(result.stdout).toMatch(/env is empty/);
  });

  it('it has extraEnvFiles', async () => {
    const result = await runNxCommandAsync(
      `multi-env-print myapp --extraEnvFiles=.prod.env,missingFile.env`,
      noNxColors
    );
    expect(result.stdout).toMatch(
      /missingFile.env \(file not found, ignored\)/
    );
    expect(result.stdout).toMatch(/.prod.env$/m);
    expect(result.stdout).toMatch(/NX_BUILD_ENV=prod/);
    expect(result.stdout).toMatch('No envChain provided');
  });

  it('it has envChain', async () => {
    const result = await runNxCommandAsync(
      `multi-env-print myapp --envChain=dev`,
      noNxColors
    );
    expect(result.stdout).toMatch(/No extra envFiles provided/);
    expect(result.stdout).toMatch(/envChain "dev"/);
    expect(result.stdout).toMatch(/.shared.env$/m);
    expect(result.stdout).toMatch(/.dev.env$/m);
    expect(result.stdout).toMatch(/apps\/myapp\/\.shared.env$/m);
    expect(result.stdout).toMatch(/apps\/myapp\/\.dev.env$/m);
    expect(result.stdout).toMatch(/NX_BUILD_ENV=dev/);
  });

  it('it has both envChain and extraEnvFiles and the latter takes precedence', async () => {
    const result = await runNxCommandAsync(
      `multi-env-print myapp --envChain=dev --extraEnvFiles=missingFile.env,.prod.env`,
      noNxColors
    );

    expect(result.stdout).toMatch(/envChain "dev"/);
    expect(result.stdout).toMatch(/.shared.env$/m);
    expect(result.stdout).toMatch(/.dev.env$/m);
    expect(result.stdout).toMatch(/apps\/myapp\/\.shared.env$/m);
    expect(result.stdout).toMatch(/apps\/myapp\/\.dev.env$/m);

    expect(result.stdout).toMatch(
      /missingFile.env \(file not found, ignored\)/
    );
    expect(result.stdout).toMatch(/.prod.env$/m);
    expect(result.stdout).toMatch(/NX_BUILD_ENV=prod/);
    expect(result.stdout).toMatch(/NX_APP_NAME=app/);
  });

  it('has partial envChain', async () => {
    const result = await runNxCommandAsync(
      `multi-env-print myapp --envChain=local`,
      noNxColors
    );

    expect(result.stdout).toMatch(/--> \.local.env \(file not found, ignored\)/);
    // From shared env
    expect(result.stdout).toMatch(/NX_LANGUAGE=en/);
    expect(result.stdout).toMatch(/NX_APP_NAME=app/);

    // From local env
    expect(result.stdout).toMatch(/NX_MY_LOCAL=1/);
  });
});
