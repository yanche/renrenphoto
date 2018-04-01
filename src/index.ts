
import * as fs from "fs";
import * as path from "path";
import * as util from "util";
import * as http from "http";
import { URL } from "url";
import * as mkdirp from "mkdirp";
import * as jsdom from "jsdom";
import { roll } from "@belongs/asyncutil";

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const mkdir = util.promisify(mkdirp);

export async function processFolder(folderPath: string, targetFolderPath: string): Promise<void> {
    const files = await readdir(folderPath);
    console.info(files);
    for (let file of files) {
        await processFile(path.join(folderPath, file), path.join(targetFolderPath, path.parse(file).name));
    }
}

export async function processFile(filePath: string, targetFolderPath: string): Promise<void> {
    console.info(`mapping ${filePath} --> ${targetFolderPath}`);

    const content = await readFile(filePath);
    const dom = new jsdom.JSDOM(content);
    const result: string[] = [];
    dom.window.document.querySelectorAll("#photo-list img").forEach(img => {
        const url = JSON.parse(img.getAttribute("data-viewer")).url;
        result.push(url);
    });

    await mkdir(targetFolderPath);

    await roll(result, (url: string) => {
        console.info(`downloading ${url}`);
        const urlset = url.split("/");
        const filename = urlset[urlset.length - 1];
        return new Promise((resolve, rej) => {
            const httpReturn = http.get(new URL(url), (res: http.IncomingMessage) => {
                if (res.statusCode === 200) {
                    res.pipe(fs.createWriteStream(path.join(targetFolderPath, filename)));
                    res.on("end", resolve);
                    res.on("error", rej);
                } else {
                    rej(new Error(`url: ${url} responds with bad code: ${res.statusCode}`));
                }
            });
            httpReturn.end();
            httpReturn.on("error", rej);
        })
    }, 5);
}
