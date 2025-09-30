Neutralino.init();

async function downloadFile(url, destPath) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = new Uint8Array(await response.arrayBuffer());

        // Ensure the directory exists
        const dir = destPath.substring(0, destPath.lastIndexOf("/"));
        try {
            await Neutralino.filesystem.createDirectory(dir, { recursive: true });
        } catch (err) {
            // Directory may already exist, ignore
        }

        await Neutralino.filesystem.writeBinaryFile(destPath, buffer);
        return { success: true, path: destPath };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

// Listen for download requests
Neutralino.events.on("downloadImage", async (msg) => {
    const { url, destPath } = msg.detail;
    const result = await downloadFile(url, destPath);
    Neutralino.events.emit("downloadImage:done", result);
});
