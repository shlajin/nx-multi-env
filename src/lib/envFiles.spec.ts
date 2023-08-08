import * as path from 'path';
import {
  buildEnvFilesChain,
  mergeEnvFiles,
  rejectExistingEnv,
} from './envFiles';

describe('mergeEnvFiles', () => {
  // fs.readFile(path.join(path))
  const envFiles = ['.build.dev.env', '.build.prod.env', '.language.env'].map(
    (fileName) =>
      path.join(
        expect.getState().testPath,
        '..',
        '__spec__',
        'support',
        fileName
      )
  );

  it('produces empty env with no env', () => {
    expect(mergeEnvFiles([])).toStrictEqual({});
  });

  it('loads env from a single file', () => {
    expect(mergeEnvFiles([envFiles[0]])).toStrictEqual({
      NX_BUILD_ENV: 'dev',
    });
  });

  it('loads from two files without overwrites', () => {
    expect(mergeEnvFiles([envFiles[0], envFiles[2]])).toStrictEqual({
      NX_BUILD_ENV: 'dev',
      NX_LANGUAGE: 'en',
      NX_REGION: 'us-east-1',
    });
  });

  it('loads from two files with overwrites', () => {
    expect(mergeEnvFiles([envFiles[0], envFiles[1]])).toStrictEqual({
      NX_BUILD_ENV: 'prod',
      NX_SOURCE_MAPS: 'true',
    });
  });

  it('loads from three files with correct overwrites and merges', () => {
    expect(mergeEnvFiles(envFiles)).toStrictEqual({
      NX_BUILD_ENV: 'prod',
      NX_SOURCE_MAPS: 'true',
      NX_LANGUAGE: 'en',
      NX_REGION: 'us-east-1',
    });
  });

  it('loads from three files, but order matters', () => {
    expect(mergeEnvFiles(envFiles.slice().reverse())).toStrictEqual({
      NX_BUILD_ENV: 'dev',
      NX_SOURCE_MAPS: 'true',
      NX_LANGUAGE: 'en',
      NX_REGION: 'us-east-1',
    });
  });
});

describe('buildEnvFilesChain', () => {
  it('constructs full path env chain', () => {
    expect(buildEnvFilesChain('dev', 'myApp')).toStrictEqual([
      '.shared.env',
      '.dev.env',
      'apps/myApp/.shared.env',
      'apps/myApp/.dev.env',
    ]);
  });

  it('dedupes file paths', () => {
    expect(buildEnvFilesChain('shared', 'myApp')).toStrictEqual([
      '.shared.env',
      'apps/myApp/.shared.env',
    ]);
  });
});

describe('rejectExistingEnv', () => {
  it('returns everything if the existing env is empty', () => {
    const newEnv = { key: '1', abc: 'cde' };
    expect(rejectExistingEnv({}, newEnv)).toStrictEqual({
      envToAppend: newEnv,
      rejectedKeys: [],
    });
  });

  it('rejects the existing keys', () => {
    expect(
      rejectExistingEnv(
        { key: '1', qwe: 'rty', else: 'yes' },
        { key: '1', abc: 'cde', qwe: 'rty' }
      )
    ).toStrictEqual({
      envToAppend: {
        abc: 'cde',
      },
      rejectedKeys: ['key', 'qwe'],
    });
  });

  it('rejects everything', () => {
    expect(
      rejectExistingEnv({ a: '1', b: '2', c: '3' }, { a: '1' })
    ).toStrictEqual({
      envToAppend: {},
      rejectedKeys: ['a'],
    });
  });
});
