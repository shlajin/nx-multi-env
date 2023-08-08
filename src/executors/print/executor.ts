import { RunExecutorSchema } from './schema';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import { logger, output } from '@nx/devkit';
import {
  buildEnvFilesChain,
  discardMissingFiles,
  mergeEnvFiles,
  rejectExistingEnv,
} from '../../lib/envFiles';

const getOnlyExistingFilesAndReport = (listRaw: string[]) => {
  const list = discardMissingFiles(listRaw);

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
  const { envChain, printFullEnv, extraEnvFiles } = options;

  output.note({
    title: printFullEnv
      ? 'Printing full resulting env'
      : 'Print env added by nx-multi-env',
    bodyLines: [
      'Subsequent files in the list will overwrite conflicting keys of the preceding files.',
      'That means the keys located in the file that is printed last will have the most priority.',
      'nx-multi-env does not overwrite existing env variables, it means your ad-hoc env variables or the ones provided',
      'by nx itself will not be overwritten. Use built-in mechanisms of nx to overwrite those.',
      'Reference: https://nx.dev/recipes/tips-n-tricks/define-environment-variables#setting-environment-variables',
    ],
  });

  if (!printFullEnv) {
    output.logSingleLine(
      `Note: printing ${output.bold(
        'env added by nx-multi-env only'
      )}. Your app will receive a bigger set of environment variables.`
    );
    output.logSingleLine(
      `It will include ad-hoc env variables, env variables added by NX and env variables exported in your current shell session.`
    );
    output.logSingleLine(
      `To print full set of env variables, pass the flag "${output.colors.cyan(
        '--printFullEnv'
      )}"`
    );
    output.logSingleLine(
      `Env variables added by NX reference: https://nx.dev/recipes/tips-n-tricks/define-environment-variables#setting-environment-variables`
    );
  }
  output.addVerticalSeparatorWithoutNewLines();

  const resultingEnv = {
    ...processEnvChain(context.projectName, envChain),
    ...processExtraEnvFiles(extraEnvFiles),
  };
  const { envToAppend, rejectedKeys } = rejectExistingEnv(
    process.env,
    resultingEnv
  );

  if (printFullEnv) {
    // Cleaning out the standard env vars from the resulting env
    logger.info(' ');
    logger.info(
      output.colors.green(
        'Starting env variables (the ones added by NX and your shell, not overwritten):'
      )
    );
    Object.keys(process.env).forEach((key) => {
      const message = `  ${key}=${process.env[key]}`;
      logger.info(
        message +
          (rejectedKeys.includes(key)
            ? output.colors.red('  (conflicts with your nx-multi-env files)')
            : '')
      );
    });

    logger.info(' ');
    logger.info(output.colors.green('Added env variables by nx-multi-env:'));
    if (Object.keys(envToAppend).length === 0) {
      logger.info(output.colors.gray('  (env is empty)'));
    }

    Object.keys(envToAppend).forEach((key) => {
      logger.info(`  ${key}=${envToAppend[key]}`);
    });

    if (rejectedKeys.length > 0) {
      logger.warn(' ');
      logger.warn(
        'One or multiple keys in your nx-multi-keys were ignored, because they are shadowed by default NX env variables and/or shell env variables.'
      );
      logger.warn(
        `Conflicting key(s): ${rejectedKeys.map((x) => `"${x}"`).join(', ')}.`
      );
    }
  } else {
    logger.info(' ');
    logger.info(output.colors.green('Added env variables by nx-multi-env:'));
    if (Object.keys(resultingEnv).length === 0) {
      logger.info(output.colors.gray('  (env is empty)'));
    }

    Object.keys(resultingEnv).forEach((key) => {
      const message = `  ${key}=${resultingEnv[key]}`;
      logger.info(
        message +
          (rejectedKeys.includes(key)
            ? output.colors.red('  (conflicts with standard env!)')
            : '')
      );
    });

    if (rejectedKeys.length > 0) {
      logger.warn(' ');
      logger.warn(
        `Some nx-multi-keys interfere with default NX env variables and/or shell variables. Conflicting key(s): ${rejectedKeys
          .map((x) => `"${x}"`)
          .join(', ')}.`
      );
      logger.warn(
        'nx-multi-keys never overwrites existing env variables. Variables highlighted above might have different values when you nx-multi-env:run your app.'
      );
      logger.warn('Re-run this command with --printFullEnv for more details.');
    }
  }

  // if (printFullEnv && shadowedByStandardEnv.length > 0) {
  //   logger.warn(
  //     `Env variables defined in your nx-multi-env files, but ignored, because they are also provided by NX or your shell: ${shadowedByStandardEnv.join(
  //       ', '
  //     )}`
  //   );
  // }
  return { success: true };
}
