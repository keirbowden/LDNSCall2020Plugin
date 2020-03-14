import { statSync } from 'fs';

/*
 * Check if a file/directory exists
 */
let fileExists = (pathname) => {
    let result=true;
    try {
        statSync(pathname);
    } catch (e) {
        result=false;
    }

    return result;
}

export {fileExists}