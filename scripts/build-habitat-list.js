const fs = require("fs/promises");
const path = require("path");

const {
  fetchHabitatCatalog,
  habitatsToText,
  loadDotEnv,
} = require("./habitat-data-utils");

const OUTPUT_DIR = path.resolve(__dirname, "..", "generated", "habitats");
const JSON_PATH = path.join(OUTPUT_DIR, "all-habitats.json");
const TEXT_PATH = path.join(OUTPUT_DIR, "all-habitats.txt");

const main = async () => {
  await loadDotEnv();
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const habitats = await fetchHabitatCatalog();

  await fs.writeFile(JSON_PATH, JSON.stringify(habitats, null, 2), "utf8");
  await fs.writeFile(TEXT_PATH, habitatsToText(habitats), "utf8");

  console.log(`Wrote habitat list to ${JSON_PATH}`);
  console.log(`Wrote habitat text list to ${TEXT_PATH}`);
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
