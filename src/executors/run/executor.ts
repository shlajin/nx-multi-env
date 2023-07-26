import { RunExecutorSchema } from './schema';

export default async function runExecutor(options: RunExecutorSchema) {
  console.log('Executor run', options);
  return {
    success: true,
  };
}
