
import { processFolder } from "./src";

const srcFolder = process.argv[2];
const tgtFolder = process.argv[3];

console.info(`reading renren html from ${srcFolder}, write photoes into ${tgtFolder}`);

processFolder(srcFolder, tgtFolder)
    .then(() => {
        console.info("done");
    })
    .catch((err: Error) => {
        console.error(err.stack);
    });
