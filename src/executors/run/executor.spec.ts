import { RunExecutorSchema } from './schema';
import executor from './executor'
import * as fs from 'fs';
import * as path from 'path';
import { buildEnvFilesChain, mergeEnvFiles } from "../../lib/envFiles"

const options: RunExecutorSchema = {};

describe('Run Executor', () => {
  it('can run', async () => {
    // const output = await executor(options);
    // expect(output.success).toBe(true);
  });
});

