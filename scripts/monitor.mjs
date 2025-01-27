import { watch } from "fs/promises";
import { spawn } from "child_process";
import path from "path";

async function runCompile() {
    console.log("🔄 Changes detected, recompiling...");

    const compile = spawn("node", ["scripts/compile.mjs"], {
        stdio: "inherit",
        shell: true
    });

    compile.on("error", (error) => {
        console.error("❌ Failed to start compile process:", error);
    });
}

async function watchDirectory() {
    try {
        console.log("👀 Watching /src directory for changes...");

        const watcher = watch("src", { recursive: true });

        for await (const event of watcher) {
            // Only recompile for relevant file changes
            if (path.extname(event.filename) === ".js" ||
                path.extname(event.filename) === ".mjs" ||
                path.extname(event.filename) === ".css") {
                await runCompile();
            }
        }
    } catch (error) {
        console.error("❌ Watch error:", error);
        process.exit(1);
    }
}

// Initial compilation
await runCompile();

// Start watching
await watchDirectory();
