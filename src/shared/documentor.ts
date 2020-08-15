import { join } from 'path';
import { writeFileSync } from 'fs';
import {HTMLGenerator} from './htmlGenerator';
import {AuraEnabledProcessor} from './processors/auraenabled/auraenabled';
import {ObjectProcessor} from './processors/object/objects';
import {TriggerProcessor} from './processors/trigger/triggers';
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
        for (let mdType of ['objects', 'triggers', 'auraenabled']) {
            if (this.config[mdType]!==undefined) {
                this.process(mdType);
            }
        }
        this.htmlGenerator.generateHTML('index.ejs', this.indexContent)
        .then(html => {
            writeFileSync(this.indexFile, html);

        })
        .catch(err => {
            console.log('Error ' + err);
        });
    }

    process(mdType) {
        let link;
        switch (mdType) {
            case 'objects':
                const objects = new ObjectProcessor(this.config, this.sourceDir, this.reportDir, this.htmlGenerator);
                link = objects.process();
                break;

            case 'triggers':
                const triggers = new TriggerProcessor(this.config, this.sourceDir, this.reportDir, this.htmlGenerator);
                link = triggers.process();
                break;

            case 'auraenabled':
                const auraenabled = new AuraEnabledProcessor(this.config, this.sourceDir, this.reportDir, this.htmlGenerator);
                link = auraenabled.process();
                break;
            }

        if (link) {
            this.indexContent.links.push(link);
        }
    }
}

export {Documentor}