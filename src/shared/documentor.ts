import { join } from 'path';
import { writeFileSync } from 'fs';
import {HTMLGenerator} from './htmlGenerator';
import {AuraEnabledProcessor} from './processors/auraenabled/auraenabled';
import {ObjectProcessor} from './processors/object/objects';
import {FlowProcessor} from './processors/flow/flows';
import {TriggerProcessor} from './processors/trigger/triggers';
import {OrderOfExecutionProcessor} from './processors/orderofexecution/orderofexecution';
import { DocumentorConfig } from './configtypes';
import { IndexContent } from './contenttypes';
import { AutomationStep } from './contenttypes';

class Documentor {
    sourceDir : string;
    reportDir: string;
    docsDir : string;
    config : DocumentorConfig;
    htmlGenerator : HTMLGenerator;
    indexFile: string;
    indexContent : IndexContent;
    ejsTemplateDirName: string;
    objectAutomation: Map<string, Map<number, AutomationStep>>;
    rollUpSummaries: Map<String, Array<String>>;


    constructor(sourceDir: string, reportDir: string, config : DocumentorConfig, ejsTemplateDirName: string) {
        this.sourceDir=sourceDir;
        this.reportDir=reportDir;
        this.config=config;
        if (!this.config.backgroundColor) {
            this.config.backgroundColor="#c9a9d6";
        }

        if (!this.config.color) {
            this.config.color="#01010c";
        }

        this.htmlGenerator=new HTMLGenerator(this.config, ejsTemplateDirName);
        this.indexFile=join(this.reportDir, 'index.html');
        this.indexContent={links: [],
                           title: this.config.title||"Org report",
                           subtitle: this.config.subtitle||"Direct from your metadata",
                           header: {
                                backgroundColor: this.config.backgroundColor,
                                color: this.config.color
                            }
                           };

        this.objectAutomation=new Map();
        this.rollUpSummaries=new Map();
    }
    
    document() {
        for (let mdType of ['objects', 'triggers', 'flows', 'auraenabled', 'orderofexecution']) {
            if (this.config[mdType]!==undefined) {
                this.process(mdType);
            }
        }
        this.htmlGenerator.generateHTML('index.ejs', this.indexContent)
        .then(html => {
            writeFileSync(this.indexFile, html);
            //console.log('Object automation = ' + JSON.stringify(Object.fromEntries(this.objectAutomation), null, 4));
        })
        .catch(err => {
            console.log('Error ' + err);
        });
    }

    process(mdType) {
        let link;
        switch (mdType) {
            case 'objects':
                const objects = new ObjectProcessor(this.config, this.sourceDir, this.reportDir, this.htmlGenerator, this.objectAutomation, this.rollUpSummaries);
                link = objects.process();
                break;

            case 'triggers':
                const triggers = new TriggerProcessor(this.config, this.sourceDir, this.reportDir, this.htmlGenerator, this.objectAutomation);
                link = triggers.process();
                break;

            case 'flows':
                const flows = new FlowProcessor(this.config, this.sourceDir, this.reportDir, this.htmlGenerator, this.objectAutomation);
                link = flows.process();
                break;

            case 'auraenabled':
                const auraenabled = new AuraEnabledProcessor(this.config, this.sourceDir, this.reportDir, this.htmlGenerator);
                link = auraenabled.process();
                break;

            case 'orderofexecution':
                const orderofexecution = new OrderOfExecutionProcessor(this.config, this.sourceDir, this.reportDir, this.htmlGenerator, this.objectAutomation, this.rollUpSummaries);
                link = orderofexecution.process();

                break;
        }

        if (link) {
            this.indexContent.links.push(link);
        }
    }
}

export {Documentor}