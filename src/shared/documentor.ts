import { join } from 'path';
import { writeFileSync } from 'fs';
import {HTMLGenerator} from './htmlGenerator';
import {ObjectProcessor} from './processors/object/objects';
import { DocumentorConfig } from './configtypes';
import { IndexContent } from './contenttypes';

class Documentor {
    sourceDir : string;
    reportDir: string;
    docsDir : string;
    config : DocumentorConfig;
    htmlGenerator : HTMLGenerator;
    indexFile: string;
    indexContent : IndexContent;
    ejsTemplateDirName: string;

    constructor(sourceDir: string, reportDir: string, config : DocumentorConfig, ejsTemplateDirName: string) {
        this.sourceDir=sourceDir;
        this.reportDir=reportDir;
        this.config=config;
        this.htmlGenerator=new HTMLGenerator(this.config, ejsTemplateDirName);
        this.indexFile=join(this.reportDir, 'index.html');
        this.indexContent={links: []};
    }
    
    document() {
        for (let mdType of ['objects']) {
            if (this.config[mdType]!==undefined) {
                this.indexContent.links.push(this.process(mdType));
            }
        }        
        this.htmlGenerator.generateHTML('index.ejs', this.indexContent)
        .then(html => {
            writeFileSync(this.indexFile, html);

        });
    }

    process(mdType) {
        let link;
        switch (mdType) {
            case 'objects':
                let objects=new ObjectProcessor(this.config, this.sourceDir, this.reportDir, this.htmlGenerator);
                link=objects.process();
                break;
            }

        return link;
    }
}

export {Documentor}