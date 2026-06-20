import { argv } from "node:process";
import { crawlSiteAsync } from "./crawl";

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
  const pages = await crawlSiteAsync(baseUrl, 5);
  console.log(pages);
}

main();
