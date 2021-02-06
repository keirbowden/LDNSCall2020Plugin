import { join } from 'path';
import { lstatSync, writeFileSync } from 'fs';
import { HTMLGenerator } from '../../htmlGenerator';
import { createDirectory, parseXMLToJS, getDirectoryEntries } from '../../files';
import { ContentLink, ObjectsContent, ObjectGroupContent, ObjectContent, ObjectFieldContent, ObjectPageLayoutData } from '../../contenttypes';
import { Metadata, MetadataGroup, DocumentorConfig } from '../../configtypes';
import { enrichField, addAdditionalFieldInfo } from './objectutils';

class ObjectProcessor {
    groups : Map<string, MetadataGroup>;
    config : DocumentorConfig;
    mdSetup : Metadata;
    sourceDir : string;
    outputDir : string;
    parentDir : string;
    indexFile : string;
    generator : HTMLGenerator;
    groupFile : string;
    reportSubdir: string;
    content: ObjectsContent; 
    missingDescriptions: boolean;
    private pageLayoutDataByObjectAndFieldName : Map<string, ObjectPageLayoutData[]>;

    constructor(config, sourceDir, outputDir, generator) {
    
        this.config=config;
        this.missingDescriptions=false;

        this.generator=generator;

        this.mdSetup=<Metadata>config['objects'];
        this.reportSubdir=this.mdSetup.reportDirectory||'objects';
        this.outputDir=join(outputDir, this.reportSubdir);
        createDirectory(this.outputDir);

        this.groups=this.mdSetup.groups;
        this.parentDir=sourceDir;
        this.sourceDir=sourceDir+this.mdSetup.subdirectory;

        this.indexFile=join(this.outputDir, '/objects.html');
    

        this.content={groups: [],
                     missingDescriptions: [],
                     counter: 0,
                     description: this.mdSetup.description,
                     header: {
                        backgroundColor: (this.mdSetup.backgroundColor||config.backgroundColor),
                        color: (this.mdSetup.color||config.color)
                    }
                    };
    }

    process() {
        this.cachePageLayouts();
        this.expandGroups();
        for (let groupName of Object.keys(this.groups)) {
            this.processGroup(this.groups[groupName]);
        }

        this.generator.generateHTML(join('objects', 'objects.ejs'), this.content)
        .then(html => {
            writeFileSync(this.indexFile, html);    
        });

        this.content.groups.forEach(group => {
            this.generator.generateHTML(join('objects', 'group.ejs'), group)
            .then(html => {
                this.groupFile=join(this.outputDir, group.name+'.html');
                writeFileSync(this.groupFile, html);
            });
        });

        let objectLink: ContentLink = {
            title: 'Objects',
            href: this.reportSubdir + '/objects.html',
            image: this.mdSetup.image,
            description: this.mdSetup.description, 
            warning: this.missingDescriptions,
            error: false
        };

        return objectLink;
    }

    cachePageLayouts() {
        this.pageLayoutDataByObjectAndFieldName = new Map<string, ObjectPageLayoutData[]>();
        const entries = getDirectoryEntries(join(this.parentDir, 'layouts'));

        for (let idx = 0, len = entries.length; idx < len; idx++) {
            const entry = entries[idx];
            let md = parseXMLToJS(join(this.parentDir, 'layouts', entry));
            md = md.Layout;

            const objName:string = entry.substring(0, entry.indexOf('-'));
            if (md.layoutSections) {
                if (!Array.isArray(md.layoutSections)) {
                    md.layoutSections = [md.layoutSections];
                }
                md.layoutSections.forEach(layoutSection => {
                    if (layoutSection.layoutColumns) {
                        if (!Array.isArray(layoutSection.layoutColumns)) {
                            layoutSection.layoutColumns = [layoutSection.layoutColumns];
                        }
                        layoutSection.layoutColumns.forEach(layoutColumn => {
                            if (layoutColumn.layoutItems) {
                                if (!Array.isArray(layoutColumn.layoutItems)) {
                                    layoutColumn.layoutItems = [layoutColumn.layoutItems];
                                }
                                layoutColumn.layoutItems.forEach(layoutItem => {
                                    const fieldName:string=String(layoutItem.field);
                                    let objLayoutData:ObjectPageLayoutData={
                                        layoutName: entry.substring(entry.indexOf('-') + 1, entry.indexOf('.layout')),
                                        objectName: objName,
                                        fieldName: fieldName,
                                        behavior : String(layoutItem.behavior)
                                    };
                                    const key:string=objName+':'+fieldName;
                                    let layoutsForObjectAndField:ObjectPageLayoutData[]=this.pageLayoutDataByObjectAndFieldName.get(key);

                                    if (!layoutsForObjectAndField) {
                                        layoutsForObjectAndField=[];
                                        this.pageLayoutDataByObjectAndFieldName.set(key, layoutsForObjectAndField);
                                    }

                                    layoutsForObjectAndField.push(objLayoutData);
                                });
                            }
                        });
                    }
                });
            }
        }
//        console.log('Page layout cache = ');
//        this.dumpCachedLayouts();
    }

    dumpCachedLayouts() {
        this.pageLayoutDataByObjectAndFieldName.forEach((value, key, map) => {
            console.log(key + ' - ' + JSON.stringify(value));
        })
    }

    expandGroups() {
        // first get all of the members from the metadata directory
        this.mdSetup.members=[];
        let entries=getDirectoryEntries(this.sourceDir);
        for (let idx=0, len=entries.length; idx<len; idx++) {
            let entry=entries[idx];
            let dirPath=join(this.sourceDir, entry);
            if (lstatSync(dirPath).isDirectory()) {
                let member={name: entry,
                            subdir: dirPath,
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
                    //console.log('Group = ' + groupName);
                    // expand the members based on prefixes/literals
                    for (let member of this.mdSetup.members) {
                        if ( ((group.objects) && (group.objects.includes(member.name))) ||
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
        let contentGroup : ObjectGroupContent={title: group.title, 
                          name: group.name, 
                          description: group.description, 
                          link: group.name + '.html', 
                          objects : [],
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
                // load the object definition file
                let md;
                try {
                    md=parseXMLToJS(join(mem.member.subdir, mem.member.name + '.object-meta.xml'));
                }
                catch (e) {
                    md={CustomObject: 
                        {label: mem.member.name,
                         description: 'Object metadata not in version control'
                        }}
                }

                let label:string=md.CustomObject.label||mem.member.name;
                contentGroup.menuItems.push({href: mem.member.name, 
                                             description: '',
                                             title: label,
                                             warning: false,
                                             error: false
                                            });

                let contentObj:ObjectContent={name: mem.member.name, 
                                label: label,
                                sfObject: md.CustomObject,
                                fields: [],
                                validationRules: [],
                                recordTypes: []};
                contentGroup.objects.push(contentObj);
                                
                this.processFields(mem.member, contentObj);
                this.processValidationRules(mem.member, contentObj);
                this.processRecordTypes(mem.member, contentObj);
                this.content.counter++;
            }
        }
    }

    processValidationRules(member, contentObj) {
        let valRulesDir=join(member.subdir, 'validationRules');
        let valRules=getDirectoryEntries(valRulesDir);
        for (let idx=0, len=valRules.length; idx<len; idx++) {
            let valRuleMd=parseXMLToJS(join(valRulesDir, valRules[idx]));
            contentObj.validationRules.push(valRuleMd.ValidationRule);
        }
    }

    processRecordTypes(member, contentObj) {
        let recTypesDir=join(member.subdir, 'recordTypes');
        let recTypes=getDirectoryEntries(recTypesDir);
        for (let idx=0, len=recTypes.length; idx<len; idx++) {
            let recTypeMd=parseXMLToJS(join(recTypesDir, recTypes[idx]));
            contentObj.recordTypes.push(recTypeMd.RecordType);
        }
    }

    processFields(member, contentObj) {
        let fieldsDir=join(member.subdir, 'fields');
        let fields=getDirectoryEntries(fieldsDir);
        for (let idx=0, len=fields.length; idx<len; idx++) {
            let fldMd=parseXMLToJS(join(fieldsDir, fields[idx]));
            enrichField(member.name, fldMd.CustomField, this.parentDir);
            let field=this.outputField(fldMd.CustomField);
            if (field.background=='orange') {
                this.missingDescriptions=true;
                this.content.missingDescriptions.push(member.name + '.' + field.fullName);
            }

            const key : string = contentObj.name + ':' + field.fullName;
            field.pageLayoutInfo=this.pageLayoutDataByObjectAndFieldName.get(key);
            contentObj.fields.push(field);
            if ( (!field.pageLayoutInfo) && 
                 (''==field.background) ) {
                field.background='#f5dfea';
            }
        }
    }

    outputField(fldMd) {
        let field: ObjectFieldContent={
            fullName: fldMd.fullName.toString(),
            label: fldMd.label,
            background: "",
            fullType: "",
            description: fldMd.description,
            sfField: fldMd,
            additionalInfo: ""
        };

        if ( (!field.label) && (-1==field.fullName.indexOf('__c')) ) {
            field.label='N/A (standard field)';
        }
    
        if ( (!field.description) && (-1==field.fullName.indexOf('__c')) ) {
            field.description='N/A (standard field)';
        }
        
        field.background='';  // change this if we need to callout anything
        if (typeof field.description === 'undefined') {
            field.background='orange';
        }
        else {
            let todoPos;
            let descStr=field.description.toString().toLowerCase();
            if (-1!=(todoPos=descStr.indexOf('todo'))) {
                if (this.config.redact) {
                    field.description=descStr.substring(0, todoPos);
                }
                else {
                    field.background='#f4e241';
                }
            }
            else if (-1!=descStr.indexOf('deprecated')) {
                field.background='#f28a8a';
            }
        }
        
        var type=fldMd.type;
        if (type) {
            type=type.toString();
            if (fldMd.formula) {
                type='Formula (' + type + ')';
            }
            else if (type=='Html') {
                type='Rich TextArea';
            }
        }
        else {
            type="N/A (standard field)";
        }
    
        field.additionalInfo=addAdditionalFieldInfo(fldMd, type);
        field.fullType=type;

        return field;
    }

}

export {ObjectProcessor}