import { RunExecutorSchema } from './schema';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import { runExecutor as runAnotherExecutor } from '@nx/devkit';
import * as dotenv from 'dotenv';
import * as path from 'path';

export default async function runExecutor(
  options: RunExecutorSchema,
  context: ExecutorContext
) {
  // const {
  //   envChain,
  //   extraEnvFiles,
  //   _: [target, ...restUnnamedArgs],
  //   ...restOptions
  // } = options;
  //
  // console.log('Picking up extraEnvs:', options.extraEnvFiles);
  // console.log('Calling ', target, 'with ', restUnnamedArgs, 'and', restOptions);
  //
  // console.log('Build env is ', process.env.NX_BUILD_ENV);
  //
  // console.log({ context });
  //
  // const envFilePath = path.join(context.root, '.dev.env');
  // console.log('Loading from', envFilePath);
  // const myResult = dotenv.populate();
  //
  // const result = await runAnotherExecutor(
  //   { project: context.projectName, target: target },
  //   {}, // TODO: I can specify overrides here if I needed
  //   context
  // );
  //
  // for await (const res of result) {
  //   if (!res.success) return res;
  // }

  return { success: true };
}


