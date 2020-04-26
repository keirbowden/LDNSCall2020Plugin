import { statSync, mkdirSync, readFileSync, readdirSync, lstatSync } from 'fs';
import { parse} from 'fast-xml-parser';

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

/*
 * Create a directory if it doesn't exist
 */
let createDirectory = (pathname) => {
    if (!fileExists(pathname)) {
        mkdirSync(pathname);
    }
}

/*
 * Parse XML format file
 */
let parseXMLToJS = (pathname) => {
    var body=readFileSync(pathname, 'utf-8');
    return parse(body);
}

let getDirectoryEntries = (pathname) => {
    let result:Array<string>=[];
    if ( (fileExists(pathname)) && (lstatSync(pathname).isDirectory()) ) {
        result=readdirSync(pathname);
    }

    return result;
}

export { createDirectory, parseXMLToJS, getDirectoryEntries, fileExists }