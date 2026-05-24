const fs = require("fs/promises");
const path = require("path");

const {
  buildFishForHabitat,
  loadDotEnv,
  slugify,
} = require("./habitat-data-utils");

const OUTPUT_DIR = path.resolve(__dirname, "..", "generated", "fish-by-habitat");

const main = async () => {
  await loadDotEnv();

  const habitatQuery = process.argv.slice(2).join(" ").trim();
  if (!habitatQuery) {
    throw new Error('Usage: node scripts/build-fish-per-habitat.js "habitat query"');
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const data = await buildFishForHabitat(habitatQuery);
  const outputPath = path.join(
    OUTPUT_DIR,
    `${slugify(data.habitat.habitatInformationName)}.json`,
  );

  await fs.writeFile(outputPath, JSON.stringify(data, null, 2), "utf8");

  console.log(`Wrote habitat fish JSON to ${outputPath}`);
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
