import { RunExecutorSchema } from './schema';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import { logger, output, runExecutor as runAnotherExecutor } from '@nx/devkit';
import * as dotenv from 'dotenv';
import * as path from 'path';
import {
  buildEnvFilesChain,
  discardMissingFiles,
  mergeEnvFiles,
} from '../../lib/envFiles';

const processExtraEnvFiles = (extraEnvFiles?: string) => {
  if (!extraEnvFiles || extraEnvFiles.length === 0) return {};
  const extraEnvFilesSeparatedRaw = extraEnvFiles.split(',');
  const extraEnvFilesSeparated = discardMissingFiles(extraEnvFilesSeparatedRaw);

  // Report mismatch
  extraEnvFilesSeparatedRaw.forEach((raw) => {
    if (!extraEnvFilesSeparated.includes(raw)) {
      output.logSingleLine(
        output.colors.red(`  Extra env file "${raw}" cannot be found, ignored.`)
      );
    }
  });

  return mergeEnvFiles(extraEnvFilesSeparated);
};

const processEnvChain = (projectName: string, envChain?: string) => {
  if (!envChain || envChain.length === 0) {
    return {};
  }

  const envFilesChainRaw = buildEnvFilesChain(envChain, projectName);
  const envFilesChain = discardMissingFiles(envFilesChainRaw);

  return mergeEnvFiles(envFilesChain);
};

export default async function runExecutor(
  options: RunExecutorSchema,
  context: ExecutorContext
) {
  if (!options['_'] || !options['_'][0]) {
    output.error({
      title: 'Incorrect multi-env run invocation',
      bodyLines: [
        `You should provide both target and app name. Unlike regular \`nx\` commands, the first argument has to be ${output.colors.cyan(
          'projectName'
        )} followed by ${output.colors.cyan(
          'target'
        )}, e.g. ${output.colors.cyan('myapp serve')}`,
        `Command ran with target "${output.colors.cyan(
          options?.[0]
        )}" and project "${output.colors.cyan(context.projectName)}"`,
      ],
    });
    return { success: false };
  }
  const {
    envChain,
    extraEnvFiles,
    _: [target, ...restUnnamedArgs],
    ...restOptions
  } = options;

  const resultingEnv = {
    ...processEnvChain(context.projectName, envChain),
    ...processExtraEnvFiles(extraEnvFiles),
  };

  dotenv.populate(process.env, resultingEnv);
  const result = await runAnotherExecutor(
    { project: context.projectName, target: target },
    {}, // TODO: I can specify overrides here if I needed
    context
  );

  for await (const res of result) {
    if (!res.success) return res;
  }

  return { success: true };
}
