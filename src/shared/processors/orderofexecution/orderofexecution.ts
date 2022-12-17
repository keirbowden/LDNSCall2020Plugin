import { join } from 'path';
import { writeFileSync } from 'fs';
import { HTMLGenerator } from '../../htmlGenerator';
import { createDirectory } from '../../files';
import { FlowsContent, AutomationStep } from '../../contenttypes';
import { Metadata, MetadataGroup, DocumentorConfig } from '../../configtypes';

class OrderOfExecutionProcessor {
    groups : Map<string, MetadataGroup>;
    config : DocumentorConfig;
    mdSetup : Metadata;
    sourceDir : string;
    outputDir : string;
    parentDir : string;
    indexFile : string;
    generator : HTMLGenerator;
    groupFile : string;
    reportSubdir : string;
    content: FlowsContent; 
    automation: Map<string, Map<number, AutomationStep>>;
    rollUpSummaries: Map<String, Array<String>>;

    constructor(config, sourceDir, outputDir, generator, automation, rollUpSummaries) {
    
        this.config=config;
        this.generator=generator;
        this.automation=automation;
        this.rollUpSummaries=rollUpSummaries;

        this.mdSetup=<Metadata>config['orderofexecution'];
        this.reportSubdir=this.mdSetup.reportDirectory||'orderofexecution';
        this.outputDir=join(outputDir, this.reportSubdir);
        createDirectory(this.outputDir);

        this.groups=this.mdSetup.groups;
        this.parentDir=sourceDir;
        this.sourceDir=sourceDir+this.mdSetup.subdirectory;

        this.indexFile=join(this.outputDir, '/orderofexecution.html');
    

        this.content={groups: [],
                     counter: 0,
                     header: {
                        backgroundColor: (this.mdSetup.backgroundColor||config.backgroundColor),
                        color: (this.mdSetup.color||config.color)
                    }
            };
    }

    process() {
        this.rollUpSummaries.forEach((value, key) => {
            const keyEles=key.split('.');
            let objectName=keyEles[0];
            let fieldName=keyEles[1];
            let automationForObject=this.automation.get(objectName);
            let roses='<ul>';
            value.forEach((ros) => {
                roses+='<li>' + ros + '</li>';
            });
            roses+='</ul><hr/>';

            automationForObject.get(16).items.push({ index: -1,
            name: '<p><b>' + fieldName + '</b> is referenced in the roll up summary fields : </p>' + roses});
        });

        const automationContent={
            header: {
                backgroundColor: this.config.backgroundColor,
                color: this.config.color
            },
            objectAutomation: []
        }
        
        this.automation.forEach((value, key) => {
            const ele={
                name: key,
                automation: []
            }
            value.forEach((stepValue, stepIndex) => {
                ele.automation.push(stepValue)
            });
            automationContent.objectAutomation.push(ele);
        });

        this.generator.generateHTML(join('orderofexecution', 'orderofexecution.ejs'), automationContent)
        .then(html => {
            writeFileSync(join(this.outputDir, 'orderofexecution.html'), html);    
        });

        automationContent.objectAutomation.forEach(value => {
            let objectContent={
                header: {
                    backgroundColor: this.config.backgroundColor,
                    color: this.config.color
                },  
                ele : value,
                title: value.name,
                description: 'Order of execution'
            };

            this.generator.generateHTML(join('orderofexecution', 'object.ejs'),  objectContent)
            .then(html => {
                let objFile=join(this.outputDir, objectContent.ele.name+'.html');
                writeFileSync(objFile, html);
            });

            this.generator.generateHTML(join('orderofexecution', 'objectimage.ejs'),  objectContent)
            .then(html => {
                const objFile=join(this.outputDir, objectContent.ele.name + '_image.html');
                writeFileSync(objFile, html);
            });
        });

        const ooeLink = {
            title: 'Execution',
            href: this.reportSubdir + '/orderofexecution.html',
            image: this.config['orderofexecution'].image,
            description: this.config['orderofexecution'].description, 
            warning: false,
            error: false
        };
        return ooeLink;
    }
}
export {OrderOfExecutionProcessor}