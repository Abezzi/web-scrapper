import { argv } from "node:process";

function main() {
  if (!argv[2]) {
    console.log("ERROR, NO ARGUMENTS");
    process.exit(1);
  }

  if (argv[3]) {
    console.log("ERROR, TOO MANY ARGUMENTS");
    process.exit(1);
  }

  // argv.forEach((val, index) => {
  //   console.log(`arg ${index}: ${val}`);
  // });

  console.log(`Crawler started at: ${argv[2]}`);
}

main();
