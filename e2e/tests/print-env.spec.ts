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

    expect(result.stdout).toMatch(
      /--> \.local.env \(file not found, ignored\)/
    );
    // From shared env
    expect(result.stdout).toMatch(/NX_LANGUAGE=en/);
    expect(result.stdout).toMatch(/NX_APP_NAME=app/);

    // From local env
    expect(result.stdout).toMatch(/NX_MY_LOCAL=1/);
  });

  it('does not overrides ad-hoc env variables and reports about it', async () => {
    const result = await runNxCommandAsync(
      `multi-env-print myapp --envChain=dev --extraEnvFiles=.prod.env`,
      { env: { FORCE_COLOR: 'false', NX_BUILD_ENV: 'stage' } }
    );

    expect(result.stdout).toContain(
      'NX_BUILD_ENV=prod  (conflicts with standard env!)'
    );
    expect(result.stderr).toContain('Conflicting key(s): "NX_BUILD_ENV"');
    expect(result.stderr).toContain(
      'Re-run this command with --printFullEnv for more details'
    );
  });

  it('print the correct ad-hoc env variable value if --printFullEnv is passed', async () => {
    const result = await runNxCommandAsync(
      `multi-env-print myapp --envChain=dev --extraEnvFiles=.prod.env --printFullEnv`,
      { env: { FORCE_COLOR: 'false', NX_BUILD_ENV: 'stage' } }
    );

    expect(result.stdout).toContain(
      'NX_BUILD_ENV=stage  (conflicts with your nx-multi-env files)'
    );
    expect(result.stderr).toContain('Conflicting key(s): "NX_BUILD_ENV"');
  })

  it('does not override standard env files and reports about it', async () => {
    const result = await runNxCommandAsync(
      `multi-env-print myapp --envChain=dev --extraEnvFiles=.custom.env`,
      noNxColors
    );

    expect(result.stdout).toContain(
      'NX_MY_LOCAL=mistakenly-overriden  (conflicts with standard env!)'
    );

    expect(result.stderr).toContain('Conflicting key(s): "NX_MY_LOCAL"');
    expect(result.stderr).toContain(
      'Re-run this command with --printFullEnv for more details'
    );
  });

  it('print the correct standard nx env variable value if --printFullEnv is passed', async () => {
    const result = await runNxCommandAsync(
      `multi-env-print myapp --envChain=dev --extraEnvFiles=.custom.env --printFullEnv`,
      noNxColors
    );

    expect(result.stdout).toContain(
      'NX_MY_LOCAL=1  (conflicts with your nx-multi-env files)'
    );

    expect(result.stderr).toContain('Conflicting key(s): "NX_MY_LOCAL"');
  })
});
