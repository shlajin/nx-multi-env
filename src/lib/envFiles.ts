import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

export const discardMissingFiles = (listRaw: string[]) =>
  listRaw.filter((filePath: string) => fs.existsSync(filePath));

export const buildEnvFilesChain = (envName: string, appName: string) => {
  const appPath = path.join('apps', appName);
  const fileList = [
    `.shared.env`,
    `.${envName}.env`,
    path.join(appPath, '.shared.env'),
    path.join(appPath, `.${envName}.env`),
  ];

  return [...new Set(fileList)];
};

export const mergeEnvFiles = (filePaths: string[]) =>
  filePaths
    .map((filePath) => {
      return dotenv.parse(fs.readFileSync(filePath));
    })
    .reduce((sum, x) => ({ ...sum, ...x }), {});

export const rejectExistingEnv = (
  existingEnv: Record<string, string>,
  newEnv: Record<string, string>
) => {
  const rejectedKeys = Object.keys(newEnv).filter((key) => key in existingEnv);

  const envToAppend = { ...newEnv };
  rejectedKeys.forEach((key) => {
    delete envToAppend[key];
  });

  return {
    rejectedKeys,
    envToAppend,
  };
};
