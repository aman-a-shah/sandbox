import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RECIPES_PATH = path.resolve(__dirname, "generated", "recipes-by-fish", "recipes.json");
const RECIPE_SCRIPT_PATH = path.resolve(__dirname, "scripts", "build-recipes-for-fish.js");

const EMPTY_MASTER_RECIPES = {
  generatedAt: null,
  fishRecipeCount: 0,
  fishRecipes: [],
};

async function readRecipesFile() {
  try {
    const contents = await readFile(RECIPES_PATH, "utf8");
    return JSON.parse(contents);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return EMPTY_MASTER_RECIPES;
    }

    throw error;
  }
}

async function readRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function runRecipeGenerator(fishJsonPath, fishQuery) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [RECIPE_SCRIPT_PATH, fishJsonPath, fishQuery], {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `Recipe generator exited with code ${code}.`));
    });
  });
}

function recipeGenerationPlugin() {
  const middleware = async (req, res, next) => {
    try {
      if (req.method === "GET" && req.url === "/api/recipes") {
        const recipes = await readRecipesFile();
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ recipes }));
        return;
      }

      if (req.method === "POST" && req.url === "/api/recipes/generate") {
        const body = await readRequestBody(req);
        const payload = JSON.parse(body || "{}");

        if (!payload.fishJsonPath || !payload.fishQuery) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "fishJsonPath and fishQuery are required." }));
          return;
        }

        const resolvedFishJsonPath = path.resolve(__dirname, payload.fishJsonPath);
        await runRecipeGenerator(resolvedFishJsonPath, payload.fishQuery);
        const recipes = await readRecipesFile();

        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true, recipes }));
        return;
      }
    } catch (error) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Recipe generation failed.",
        }),
      );
      return;
    }

    next();
  };

  return {
    name: "generated-recipe-bridge",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  plugins: [recipeGenerationPlugin()],
  server: {
    watch: {
      ignored: ["**/generated/recipes-by-fish/**"],
    },
  },
});
