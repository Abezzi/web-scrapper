import { argv } from "node:process";
import { getHTML } from "./crawl";

function main() {
  if (!argv[2]) {
    console.log("ERROR, NO ARGUMENTS");
    process.exit(1);
  }

  if (argv[3]) {
    console.log("ERROR, TOO MANY ARGUMENTS");
    process.exit(1);
  }

  console.log(`Crawler started at: ${argv[2]}`);
  getHTML(argv[2]);
}

main();
