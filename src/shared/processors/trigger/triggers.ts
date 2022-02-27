import { join, parse } from 'path';
import { lstatSync, writeFileSync, readFileSync } from 'fs';
import { HTMLGenerator } from '../../htmlGenerator';
import { createDirectory, parseXMLToJS, getDirectoryEntries } from '../../files';
import { ContentLink, TriggersContent, TriggerGroupContent, TriggerContent, AutomationStep } from '../../contenttypes';
import { Metadata, MetadataGroup, DocumentorConfig } from '../../configtypes';

class TriggerProcessor {
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
    content: TriggersContent; 
    automation: Map<string, Map<number, AutomationStep>>;

    constructor(config, sourceDir, outputDir, generator, automation) {
    
        this.config=config;
        this.generator=generator;
        this.automation=automation;

        this.mdSetup=<Metadata>config['triggers'];
        this.reportSubdir=this.mdSetup.reportDirectory||'triggers';
        this.outputDir=join(outputDir, this.reportSubdir);
        createDirectory(this.outputDir);

        this.groups=this.mdSetup.groups;
        this.parentDir=sourceDir;
        this.sourceDir=sourceDir+this.mdSetup.subdirectory;

        this.indexFile=join(this.outputDir, '/triggers.html');
    

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

        this.checkDuplicates();

        this.generator.generateHTML(join('triggers', 'triggers.ejs'), this.content)
        .then(html => {
            writeFileSync(this.indexFile, html);    
        });

        this.content.groups.forEach(group => {
            this.generator.generateHTML(join('triggers', 'group.ejs'), group)
            .then(html => {
                this.groupFile=join(this.outputDir, group.name+'.html');
                writeFileSync(this.groupFile, html);
            });
        });

        let triggerLink: ContentLink = {
            title: 'Triggers',
            href: this.reportSubdir + '/triggers.html',
            image: this.mdSetup.image,
            description: this.mdSetup.description, 
            warning: false,
            error: this.content.duplicates.length>0
        };

        return triggerLink;
    }

    checkDuplicates() {
        let objectMap=new Map();

        this.content.groups.forEach(group => {
            group.triggers.forEach(trigger => {
                let actionsMap;
                if (objectMap.has(trigger.objectName)) {
                    actionsMap=objectMap.get(trigger.objectName);
                }
                else {
                    actionsMap=new Map();
                    objectMap.set(trigger.objectName, actionsMap);
                }

                trigger.actions.toLowerCase().split(',').forEach(action => {
                    let actionTriggers;
                    if (actionsMap.has(action)) {
                        actionTriggers=actionsMap.get(action);
                    }
                    else {
                        actionTriggers=[];
                        actionsMap.set(action, actionTriggers);
                    }

                    const triggerPrefix=trigger.name.replace('.trigger', '');
                    actionTriggers.push(triggerPrefix);
                    //console.log('Actions triggers = ' + actionTriggers);
                    if (trigger.triggerMeta.status==='Active') {
                        const actionEles=action.split(/\s+/);
                        if (['insert', 'update'].includes(actionEles[1].toLowerCase())) {
                            let pos=4;
                            if (actionEles[0]=='after') {
                                pos=8;
                            }
                            this.automation.get(trigger.objectName).get(pos).items.push({index: -1, name: triggerPrefix});
                        }
                    }
                })
            })
        })

        this.content.duplicates=[];
        for (let objectName of objectMap.keys()) {
            let actionsMap=objectMap.get(objectName);
            for (let action of actionsMap.keys()) {
                let actionTriggers=actionsMap.get(action);
                if (actionTriggers.length > 1) {
                    let dupe={
                        objectName: objectName,
                        action: action,
                        triggers: actionTriggers.join()
                    }
                    this.content.duplicates.push(dupe);
                }
            }
        }

        // console.log('Duplicates = ' + JSON.stringify(this.content.duplicates, null, 4));
    }
    
    expandGroups() {
        // first get all of the members from the metadata directory
        this.mdSetup.members=[];
        let entries=getDirectoryEntries(this.sourceDir);
        for (let idx=0, len=entries.length; idx<len; idx++) {
            let entry=entries[idx];
            if (-1==entry.indexOf('-meta.xml')) {
                let filePath=join(this.sourceDir, entry);
                if (lstatSync(filePath).isFile()) {
                    let member={name: entry,
                                subdir: null,
                                processed: false};
                    this.mdSetup.members.push(member);
                }
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
                        if ( ((group.triggers) && (group.triggers.includes(member.name))) ||
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
        let contentGroup : TriggerGroupContent={title: group.title, 
                          name: group.name, 
                          description: group.description, 
                          link: group.name + '.html', 
                          triggers : [],
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
                // load the trigger definition file
                let md=parseXMLToJS(join(this.sourceDir, mem.member.name + '-meta.xml'));
                let body=readFileSync(join(this.sourceDir, mem.member.name), 'utf-8');


                let contentObj:TriggerContent={name: mem.member.name, 
                                label: mem.member.name,
                                triggerMeta: md.ApexTrigger,
                                trigger: body

                };
                this.extractDetails(mem.member.name, body, contentObj);
                contentGroup.triggers.push(contentObj);
                                
                this.content.counter++;
            }
        }
    }

    extractDetails(name, body, contentObj) {
        // console.log('Body = ' + body);
        const prefix=parse(name).name;
        //console.log('Looking for ' + 'trigger ' + prefix);
        let pos=body.indexOf('trigger ' + prefix );
        //console.log('Pos = ' + pos);
        // now skip to 'on'
        pos=body.indexOf(' on', pos);
        //console.log('Pos now = ' + pos);
        var endPos=body.indexOf('(', pos);
        //console.log('debug', 'End pos = ' + endPos);
        contentObj.objectName=body.slice(pos + 3, endPos).trim();
    
        pos=endPos;
        endPos=body.indexOf(')', pos);
        contentObj.actions=body.slice(pos+1, endPos).trim();
    }
}

export {TriggerProcessor}