import { join } from 'path';
import { lstatSync, writeFileSync } from 'fs';
import { HTMLGenerator } from '../../htmlGenerator';
import { createDirectory, parseXMLToJS, getDirectoryEntries } from '../../files';
import { ContentLink, FlowsContent, FlowGroupContent, FlowContent, AutomationStep } from '../../contenttypes';
import { Metadata, MetadataGroup, DocumentorConfig } from '../../configtypes';

class FlowProcessor {
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

    constructor(config, sourceDir, outputDir, generator, automation) {
    
        this.config=config;
        this.generator=generator;
        this.automation=automation;

        this.mdSetup=<Metadata>config['flows'];
        this.reportSubdir=this.mdSetup.reportDirectory||'flows';
        this.outputDir=join(outputDir, this.reportSubdir);
        createDirectory(this.outputDir);

        this.groups=this.mdSetup.groups;
        this.parentDir=sourceDir;
        this.sourceDir=sourceDir+this.mdSetup.subdirectory;

        this.indexFile=join(this.outputDir, '/flows.html');
    

        this.content={groups: [],
                     counter: 0,
                     header: {
                        backgroundColor: (this.mdSetup.backgroundColor||config.backgroundColor),
                        color: (this.mdSetup.color||config.color)
                    }
            };
    }

    process() {
        this.expandGroups();
        for (let groupName of Object.keys(this.groups)) {
            this.processGroup(this.groups[groupName]);
        }

        this.generator.generateHTML(join('flows', 'flows.ejs'), this.content)
        .then(html => {
            writeFileSync(this.indexFile, html);    
        });

        this.content.groups.forEach(group => {
            this.generator.generateHTML(join('flows', 'group.ejs'), group)
            .then(html => {
                this.groupFile=join(this.outputDir, group.name+'.html');
                writeFileSync(this.groupFile, html);
            });
        });

        let flowLink: ContentLink = {
            title: 'Flows',
            href: this.reportSubdir + '/flows.html',
            image: this.mdSetup.image,
            description: this.mdSetup.description, 
            warning: false,
            error: false
        };

        return flowLink;
    }

    expandGroups() {
        // first get all of the members from the metadata directory
        this.mdSetup.members=[];
        let entries=getDirectoryEntries(this.sourceDir);
        for (let idx=0, len=entries.length; idx<len; idx++) {
            let entry=entries[idx];
            let filePath=join(this.sourceDir, entry);
            //console.log('Considering ' + filePath);
            if (lstatSync(filePath).isFile()) {
                let member={name: entry,
                            subdir: null,
                            processed: false};
                this.mdSetup.members.push(member);
            }
        }

        // now process each of the groups, adding the group member details
        for (let groupName in this.groups) {
            if ( (this.groups.hasOwnProperty(groupName)) && ('other'!==groupName) ) {
                let group=this.groups[groupName];
                group.members=[];
                if ('other'!=groupName) {
                    // expand the members based on prefixes/literals
                    for (let member of this.mdSetup.members) {
                        if ( ((group.flows) && (group.flows.includes(member.name))) ||
                             ((typeof group.prefix !=='undefined') && member.name.startsWith(group.prefix)) ||
                             ((typeof group.additional !== 'undefined') && (group.additional.includes(member))) 
                            ) 
                        {
                            let groupMember={member: member,
                                             group: group};
                            group.members.push(groupMember);
                        }
                    }    
                }
            }
        }

        // add everything to the catch-all group
        let group=this.groups['other'];
        group.members=[];
        for (let member of this.mdSetup.members) {
            var groupMember={member: member,
                            group: group};
            group.members.push(groupMember);
        }
    }

    processGroup(group : MetadataGroup) {
        group.started=true;
        let contentGroup : FlowGroupContent={title: group.title, 
                          name: group.name, 
                          description: group.description, 
                          link: group.name + '.html', 
                          flows : [],
                          menuItems : [],
                          header: {
                            backgroundColor: (group.backgroundColor||this.mdSetup.backgroundColor),
                            color: (group.color||this.mdSetup.color)
                        }
                    };

        this.content.groups.push(contentGroup);
        for (let mem of group.members) {
            if (!mem.member.processed) {
                mem.member.processed=true;
                // load the flow definition file
                let md=parseXMLToJS(join(this.sourceDir, mem.member.name));


                let contentObj:FlowContent={name: mem.member.name.slice(0, -14), 
                                label: md.Flow.label,
                                flowMeta: md.Flow
                };
                if (md.Flow.processType==='AutoLaunchedFlow') {
                    contentObj.objectName=md.Flow.start.object;
                    if (this.automation.get(contentObj.objectName)) {
                        if (md.Flow.status==='Active') {
                            let pos=-1;
                            if (md.Flow.start.triggerType==='RecordBeforeSave') {
                                pos=3;
                            }
                            else if (md.Flow.start.triggerType==='RecordAfterSave') {
                                pos=15;
                            }
                            if (-1!=pos) {
                                contentObj.action=md.Flow.start.recordTriggerType;
                                this.automation.get(contentObj.objectName).get(pos).items.push     ({index: md.Flow.triggerOrder, meta: md.Flow, name: contentObj.name});                     
                            }
                        }
                    }
                }
                
                contentGroup.flows.push(contentObj);
                                
                this.content.counter++;
            }
        }

        // sort the flow entries
        this.automation.forEach((value) => {
            value.get(3).items.sort(this.compareFlows);
            value.get(15).items.sort(this.compareFlows);
        });
    }

    compareFlows(one, other) {
        let result=0;
        if ( (one.index) && (other.index) ) {
            if (one.index > other.index) {
                result=1;
            }
            else if (one.index<other.index) {
                result=-1;
            }
            else if (one.name > other.name) {
                result=1;
            }
            else if (one.name < other.name) {
                result=1;
            }
            else {
                result=0;
            }
        }
        else if (one.index) {
            if (one.index<=1000) {
                result=1;
            }
            else {
                result=-1;
            }
        }
        else if (other.index) {
            if (other.index>1000) {
                result=1;
            }
            else {
                result=-1;
            }
        }
        
        return result;
    }
}
export {FlowProcessor}