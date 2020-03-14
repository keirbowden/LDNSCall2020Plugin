import { join } from 'path';
import { readFileSync } from 'fs';
import { appendFileSync } from 'fs';
import { writeFileSync } from 'fs';
import { DocumentorConfig } from './types';

class HTMLGenerator {
    templateDir : string;
    generatedDate : string;
    config: DocumentorConfig;

    constructor(templateDir: string, config: DocumentorConfig) {
        this.templateDir=templateDir;
        this.generatedDate=new Date().toISOString();
        this.config=config;
    }
    
    startPage(outFile: string, level=1) {
        let indexLink='';
        if (1!==level) {
            for (let idx=1; idx<level; idx++) {
                indexLink+='../';
            }
            indexLink='\n<a href="' + indexLink + 'index.html">Home</a>';    
        }
        writeFileSync(outFile, this.getFragment('pageStart') + indexLink);
    }

    endPage(outFile: string) {
        let content=this.getFragment('pageEnd');
        content=content.replace('[GENDATE]', new Date().toISOString()).replace('[VERSION]', this.config.version);
        appendFileSync(outFile, content);
    }

    indexLink(outFile: string, href: string, title: string) {
        let content=this.getFragment('indexLink');
        content=content.replace('{0}', href).replace('{1}', title);
        appendFileSync(outFile, content);
    }

    metadataHeader(outFile: string, description: string) {
        let content=this.getFragment('metadataHeader');
        content=content.replace('{0}', description);
        appendFileSync(outFile, content);
    }

    groupLink(outFile: string, name: string, href: string) {
        let content=this.getFragment('groupLink');
        content=content.replace('{0}', name).replace('{1}', href);
        appendFileSync(outFile, content);
    }

    groupTitle(outFile: string, title: string, description: string) {
        let content=this.getFragment('groupTitle');
        content=content.replace('{0}', title).replace('{1}', description);
        appendFileSync(outFile, content);
    }

    objectHeader(outFile: string, name: string, label: string, description: string) {
        let content=this.getFragment('objectHeader');
        content=content.replace(/\{0\}/g, name).replace('{1}', label).replace('{2}', description);
        appendFileSync(outFile, content);
    }
    
    getFragment(name : string) {
        return readFileSync(join(this.templateDir, name + '.html'), 'utf8');
    }

}

export {HTMLGenerator}