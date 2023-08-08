import { RunExecutorSchema } from './schema';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import { logger, output } from '@nx/devkit';
import * as fs from 'fs';
import { buildEnvFilesChain, mergeEnvFiles } from '../../lib/envFiles';

const getOnlyExistingFilesAndReport = (listRaw: string[]) => {
  const list = listRaw.filter((filePath: string) => fs.existsSync(filePath));

  listRaw.forEach((file) => {
    const exists = list.includes(file);
    const message = `  --> ${file}`;
    if (exists) logger.info(message);
    else
      logger.info(output.colors.gray(`${message} (file not found, ignored)`));
  });

  return list;
};

const processEnvChain = (projectName: string, envChain?: string) => {
  if (!envChain || envChain.length === 0) {
    logger.log('No envChain provided (no --envChain flag)');
    return {};
  }

  logger.log(`Loading envChain "${output.colors.cyan(envChain)}"`);
  const envFilesChainRaw = buildEnvFilesChain(envChain, projectName);
  const envFilesChain = getOnlyExistingFilesAndReport(envFilesChainRaw);

  return mergeEnvFiles(envFilesChain);
};

const processExtraEnvFiles = (extraEnvFiles?: string) => {
  if (!extraEnvFiles || extraEnvFiles.length === 0) {
    logger.log('No extra envFiles provided (no `--extraEnvFiles` flag)');
    return {};
  }

  logger.log('Adding extra envFiles on top of the envChain');
  const extraEnvFilesSeparatedRaw = extraEnvFiles.split(',');
  const extraEnvFilesSeparated = getOnlyExistingFilesAndReport(
    extraEnvFilesSeparatedRaw
  );

  return mergeEnvFiles(extraEnvFilesSeparated);
};

export default async function runExecutor(
  options: RunExecutorSchema,
  context: ExecutorContext
) {
  const { envChain, appName: string, extraEnvFiles } = options;

  output.note({
    title: 'Printing the full env',
    bodyLines: [
      'Subsequent files in the list will overwrite conflicting keys of the preceding files.',
      'That means the keys located in the file that is printed last will have the most priority.',
    ],
  });

  output.addVerticalSeparatorWithoutNewLines();


  const resultingEnv = {
    ...processEnvChain(context.projectName, envChain),
    ...processExtraEnvFiles(extraEnvFiles),
  };

  logger.info('Resulting env: ');
  if (Object.keys(resultingEnv).length === 0) logger.info('  (env is empty)');
  Object.keys(resultingEnv).forEach((key) => {
    logger.info(`  ${key}=${resultingEnv[key]}`);
  });
  return { success: true };
}
