import fs from "fs/promises";
import { mkdir } from "fs/promises";
import { header } from "../src/userscript.config.mjs";

async function compile() {
    try {
        // Ensure dist directory exists
        await mkdir("dist", { recursive: true });

        // Read the source file
        const sourceCode = await fs.readFile("src/plex-guid-grabber.js", "utf8");

        // Combine header and source
        const fullScript = `${header}\n\n${sourceCode}`;

        // Write the combined file
        await fs.writeFile("dist/plex-guid-grabber.user.js", fullScript, "utf8");

        console.log("✅ Successfully compiled userscript");
    } catch (error) {
        console.error("❌ Error during compilation:", error);
        process.exit(1);
    }
}

compile();
