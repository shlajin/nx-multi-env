import {
  ensureNxProject,
  exists,
  runNxCommand,
  runPackageManagerInstall,
  tmpBackupProjPath,
  tmpProjPath,
  updateFile,
} from '@nx/plugin/testing';
import { readRootPackageJson, logger } from '@nx/devkit';
import * as fs from 'fs';
import * as path from 'path';

const copyEnvFiles = () => {
  const sourceEnvFilesDir = path.join(
    expect.getState().testPath,
    '..',
    'support',
    'envFiles'
  );
  const envChainFiles = ['.dev.env', '.prod.env', '.shared.env', '.local.env'];
  envChainFiles.forEach((envFileName) => {
    const mapping = {
      '.': sourceEnvFilesDir,
      'apps/myapp': path.join(sourceEnvFilesDir, 'app'),
    };
    const localPaths = Object.keys(mapping);
    localPaths.forEach((dirName) => {
      const sourceFilePath = path.join(mapping[dirName], envFileName);
      if (fs.existsSync(sourceFilePath)) {
        updateFile(
          `${dirName}/${envFileName}`,
          fs.readFileSync(sourceFilePath).toString()
        );
      }
    });
  });
};

const generateSampleApp = () => {
  runNxCommand(
    'generate @nx/node:app myapp --framework=none --e2e-test-runner=none --no-interactive'
  );

  updateFile('apps/myapp/project.json', (originalFileContent) => {
    const json = JSON.parse(originalFileContent);
    // Make the `serve` command quit without rebuilding
    json.targets.serve.options.watch = false;
    json.targets['multi-env-run'] = {
      executor: 'nx-multi-env:run',
    };
    json.targets['multi-env-print'] = {
      executor: 'nx-multi-env:print',
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
};

const addNodeJsToPackageJson = () => {
  updateFile('package.json', (originalFileContent) => {
    const parsedPackage = JSON.parse(originalFileContent);
    const nxVersion = readRootPackageJson().devDependencies.nx;
    parsedPackage.devDependencies['@nx/node'] = nxVersion;
    return JSON.stringify(parsedPackage, undefined, 2);
  });

  runPackageManagerInstall();
};

export const prepareRepo = () => {
  if (exists(tmpProjPath('package.json'))) {
    logger.info('Skipping setting up a test repo for faster tests...');
    return;
  }

  console.log(' --> ensureNxProject');
  ensureNxProject('nx-multi-env', 'dist/nx-multi-env');

  console.log(' --> addNodeJsToPackageJson');
  // Node is required for our sample app to run
  addNodeJsToPackageJson();
  console.log(' --> generateSampleApp');
  generateSampleApp();
  console.log(' --> copyEnvFiles');
  copyEnvFiles();
};
