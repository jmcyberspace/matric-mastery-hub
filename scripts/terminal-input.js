import readline from 'node:readline';
import { Writable } from 'node:stream';
export function secretInput(prompt) {
  if (!process.stdin.isTTY) throw new Error('Run this command in an interactive terminal. Password input must not be passed as a shell argument.');
  return new Promise(resolve => {
    const output = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
    const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
    process.stdout.write(prompt);
    rl.question('', answer => { rl.close(); process.stdout.write('\n'); resolve(answer); });
  });
}
