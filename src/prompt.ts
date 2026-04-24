import * as readline from "readline";

export interface PromptOptions {
  message: string;
  defaultValue?: boolean;
}

export async function confirm(options: PromptOptions): Promise<boolean> {
  const { message, defaultValue = false } = options;
  const hint = defaultValue ? "[Y/n]" : "[y/N]";

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} ${hint}: `, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === "") {
        resolve(defaultValue);
      } else {
        resolve(trimmed === "y" || trimmed === "yes");
      }
    });
  });
}

export async function confirmBranchDeletion(
  branches: string[],
  dryRun: boolean
): Promise<string[]> {
  if (dryRun || branches.length === 0) {
    return branches;
  }

  console.log("\nThe following branches will be deleted:");
  branches.forEach((b) => console.log(`  - ${b}`));
  console.log("");

  const all = await confirm({
    message: `Delete all ${branches.length} branch(es)?`,
    defaultValue: false,
  });

  if (all) {
    return branches;
  }

  const selected: string[] = [];
  for (const branch of branches) {
    const yes = await confirm({
      message: `  Delete "${branch}"?`,
      defaultValue: false,
    });
    if (yes) {
      selected.push(branch);
    }
  }

  return selected;
}
