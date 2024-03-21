import { RunExecutorSchema } from './schema';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import { logger, output, runExecutor as runAnotherExecutor } from '@nx/devkit';
import * as dotenv from 'dotenv';
import * as path from 'path';
import {
  buildEnvFilesChain,
  discardMissingFiles,
  mergeEnvFiles,
  prepareEnvChainString,
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

export default async function* runExecutor(
  options: RunExecutorSchema,
  context: ExecutorContext
) {
  // Dead code... does not get triggered when you actually forget to pass the command after the project
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
    envChain: envChainUnprocessed,
    extraEnvFiles,
    _: [target, ...restUnnamedArgs],
    ...restOptions
  } = options;

  const envChain = prepareEnvChainString(
    envChainUnprocessed,
    context as unknown as Record<string, string>
  );

  if (restUnnamedArgs.length > 0) {
    output.warn({
      title: 'Detected unexpected additional arguments',
      bodyLines: [
        `These arguments are: ${restUnnamedArgs
          .map((r) => `"${output.colors.red(r)}"`)
          .join(', ')}`,
        'These arguments will be ignored. Please file an issue if you need to use them.',
      ],
    });
  }
  const resultingEnv = {
    ...processEnvChain(context.projectName, envChain),
    ...processExtraEnvFiles(extraEnvFiles),
  };

  dotenv.populate(process.env, resultingEnv);

  const result = await runAnotherExecutor(
    { project: context.projectName, target: target },
    { ...restOptions },
    context
  );

  for await (const res of result) {
    // Proxying response back; important for e2e cypress runner in order to work!
    yield res;
    if (!res.success) {
      // We, probably, should not do anything and just wait until the child generator gracefully finishes.
      // Otherwise, an error during development 'serve' action might kill the process, instead of waiting until the error is fixed
      // return res;
    }
  }

  return { success: true };
}
