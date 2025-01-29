import write from "write";
import fs from "fs/promises";
import { readFileSync } from "fs";
import { mkdir } from "fs/promises";
import { header } from "../src/userscript.config.mjs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));

async function compile() {
    try {
        // Ensure dist directory exists
        await mkdir("dist", { recursive: true });

        // Read the source JavaScript file
        const sourceCode = await fs.readFile("src/plex-guid-grabber.js", "utf8");

        // Read the CSS file
        const cssCode = await fs.readFile("src/style.css", "utf8");

        // Combine header, CSS, and source
        const fullScript = `${header}\n\nGM_addStyle(\`${cssCode}\`);\n\n${sourceCode}`;

        // Write the version file
        write.sync("dist/version.info", packageJson.version, {
            overwrite: true,
        });

        // Write the combined file
        await fs.writeFile("dist/plex-guid-grabber.user.js", fullScript, "utf8");

        console.log("✅ Successfully compiled userscript");
    } catch (error) {
        console.error("❌ Error during compilation:", error);
        process.exit(1);
    }
}

compile();
