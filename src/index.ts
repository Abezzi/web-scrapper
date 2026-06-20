import { argv } from "node:process";
import { crawlPage, getHTML } from "./crawl";

async function main() {
  let baseUrl: string;

  if (!argv[2]) {
    console.log("ERROR, NO ARGUMENTS");
    process.exit(1);
  }

  if (argv[3]) {
    console.log("ERROR, TOO MANY ARGUMENTS");
    process.exit(1);
  }

  baseUrl = argv[2];

  console.log(`Crawler started at: ${argv[2]}`);
  // getHTML(argv[2]);
  await crawlPage(baseUrl);
}

main();
