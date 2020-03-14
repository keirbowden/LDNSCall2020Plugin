import { join } from 'path';
import { readFileSync } from 'fs';
import { appendFileSync } from 'fs';
import { writeFileSync } from 'fs';
import {HTMLGenerator} from './htmlGenerator';
import {ObjectProcessor} from './processors/objects';
import { DocumentorConfig } from './types';

class Documentor {
    sourceDir : string;
    reportDir: string;
    docsDir : string;
    templateDir : string;
    config : DocumentorConfig;
    generatedDate : string;
    htmlGenerator : HTMLGenerator;
    indexFile: string;

    constructor(sourceDir: string, reportDir: string, templateDir: string, config : DocumentorConfig) {
        this.sourceDir=sourceDir;
        this.reportDir=reportDir;
        this.templateDir=templateDir;
        this.config=config;
        this.generatedDate=new Date().toISOString();
        this.htmlGenerator=new HTMLGenerator(this.templateDir, this.config);
        this.indexFile=join(this.reportDir, 'index.html');
    }
    
    startPage(outFile: string, level=1) {
        let indexLink='';
        if (1!==level) {
            indexLink+='\n';
            for (let idx=0; idx<level; idx++) {
                indexLink+='../';
            }
            indexLink+='<a href="' + indexLink + 'index.html">Home</a>';    
        }
        writeFileSync(join(this.reportDir, outFile), this.getFragment('pageStart') + indexLink);
    }

    endPage(outFile: string) {
        let content=this.getFragment('pageEnd');
        content=content.replace('[GENDATE]', new Date().toISOString()).replace('[VERSION]', this.config.version);
        appendFileSync(join(this.reportDir, outFile), content);
    }

    startMain() {
        this.htmlGenerator.startPage(this.indexFile);
        appendFileSync(this.indexFile, '    <h1>Org Report</h1>\n');
    }

    endMain() {
        this.htmlGenerator.endPage(join(this.reportDir, 'index.html'));
    }

    getFragment(name : string) {
        return readFileSync(join(this.templateDir, name + '.html'), 'utf8');
    }

    document() {
        this.startMain();
        for (let mdType of ['objects']) {
            if (this.config[mdType]!==undefined) {
                this.process(mdType);
            }
        }        
        this.endMain();
    }

    process(mdType) {
        switch (mdType) {
            case 'objects':
                let objects=new ObjectProcessor(this.config, this.sourceDir, this.reportDir, this.htmlGenerator);
                objects.process();
        }
    }
}

export {Documentor}