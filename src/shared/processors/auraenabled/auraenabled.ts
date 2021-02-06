import { AuraEnabledHeaderContent, AuraEnabledGroupContent, AuraEnabledContent, ContentLink } from '../../contenttypes';
import { createDirectory, fileExists, parseXMLToJS, getDirectoryEntries } from '../../files';
import { HTMLGenerator } from '../../htmlGenerator';
import { join } from 'path';
import { lstatSync, readFileSync, writeFileSync } from 'fs';
import { Metadata, MetadataGroup } from '../../configtypes';

interface ClassAndProfilesPermSets{
    classname: string;
    profiles: string[];
    permissionsets: string[];
}

class AuraEnabledProcessor {
    private groups : Map<string, MetadataGroup>;
    private mdSetup : Metadata;
    private sourceDir : string;
    private outputDir : string;
    private indexFile : string;
    private generator : HTMLGenerator;
    private groupFile : string;
    private reportSubdir: string;
    private content: AuraEnabledHeaderContent; 
    private profilesAndPermSetsByClassname : Map<string, ClassAndProfilesPermSets>;

    constructor(config, sourceDir, outputDir, generator) {
        this.generator=generator;

        this.mdSetup = config['auraenabled'] as Metadata;
        this.reportSubdir=this.mdSetup.reportDirectory||'auraenabled';
        this.outputDir=join(outputDir, this.reportSubdir);
        createDirectory(this.outputDir);

        this.groups = this.mdSetup.groups;
        this.sourceDir = sourceDir + this.mdSetup.subdirectory;

        this.indexFile = join(this.outputDir, '/auraenabled.html');

        this.content = {groups: [],
                     counter: 0,
                     noAccess: [],
                     header: {
                         backgroundColor: (this.mdSetup.backgroundColor||config.backgroundColor),
                         color: (this.mdSetup.color||config.color)
                     }
                    };
    }

    public process() {
        this.cacheClasses();
        this.expandGroups();
        for (const groupName of Object.keys(this.groups)) {
            this.processGroup(this.groups[groupName]);
        }

        this.generator.generateHTML(join('auraenabled', 'auraenabled.ejs'), this.content)
        .then(html => {
            writeFileSync(this.indexFile, html);    
        });

        this.content.groups.forEach(group => {
            this.generator.generateHTML(join('auraenabled', 'group.ejs'), group)
            .then(html => {
                this.groupFile=join(this.outputDir, group.name+'.html');
                writeFileSync(this.groupFile, html);
            });
        });

        let auraEnabledLink: ContentLink = {
            title: 'Aura Enabled',
            href: this.reportSubdir+ '/auraenabled.html',
            image: this.mdSetup.image,
            description: this.mdSetup.description,
            warning: false,
            error: this.content.noAccess.length > 0
        };

        return auraEnabledLink;
    }

    cacheClasses() {
        this.profilesAndPermSetsByClassname = new Map<string, ClassAndProfilesPermSets>();
        for (const type of ['profiles', 'permissionsets']) {
            const entries = getDirectoryEntries(join(this.sourceDir, type));
            for (let idx = 0, len = entries.length; idx < len; idx++) {
                const entry = entries[idx];
                const friendlyName = entry.substring(0, entry.indexOf('.'));
                let md = parseXMLToJS(join(this.sourceDir, type, entry));
                if (type === 'profiles') {
                    md = md.Profile;
                }
                else {
                    md = md.PermissionSet;
                }
                if (md.classAccesses) {
                    if (!Array.isArray(md.classAccesses)) {
                        md.classAccesses = [md.classAccesses];
                    }
                    md.classAccesses.forEach(classAccess => {
                        if (classAccess.enabled) {
                            const classname = classAccess.apexClass;
                            let classRec = this.profilesAndPermSetsByClassname.get(classname);
                            if (null == classRec) {
                                classRec = {classname,
                                            profiles: [],
                                            permissionsets: []};
                                this.profilesAndPermSetsByClassname.set(classname, classRec);
                            }
                            classRec[type].push(friendlyName);
                        }
                    });
                }
            }
        }
        //console.log('Class cache = ' + this.dumpClasses());
    }

    dumpClasses() {
        this.profilesAndPermSetsByClassname.forEach((value, key, map) => {
            console.log(key + ' - ' + JSON.stringify(value));
        })
    }

    expandGroups() {
        // first get all of the members from the metadata directories
        this.mdSetup.members = [];
        for (const type of ['aura', 'lwc']) {
            const entries = getDirectoryEntries(join(this.sourceDir, type));
            for (let idx=0, len=entries.length; idx<len; idx++) {
                const entry = entries[idx];
                if (-1 === entry.indexOf('-meta.xml')) {
                    let filePath;

                    if (type === 'aura') {
                        filePath = join(this.sourceDir, 'aura', entry, entry + '.cmp');
                    }
                    else {
                        filePath = join(this.sourceDir, 'lwc', entry, entry + '.js');
                    }

                    if (fileExists(filePath) && (lstatSync(filePath).isFile()) ){
                        const member = {name: entry,
                                    subdir: null,
                                    processed: false,
                                    componentType: type};
                        this.mdSetup.members.push(member);
                    }
                }
            }
        }

        // now process each of the groups, adding the group member details
        for (const groupName in this.groups) {
            if ( (this.groups.hasOwnProperty(groupName)) && ('other'!==groupName) ) {
                const group=this.groups[groupName];
                group.members=[];
                if ('other'!=groupName) {
                    // expand the members based on prefixes/literals
                    for (const member of this.mdSetup.members) {
                        if ( ((group.triggers) && (group.triggers.includes(member.name))) ||
                             ((typeof group.prefix !=='undefined') && member.name.startsWith(group.prefix)) ||
                             ((typeof group.additional !== 'undefined') && (group.additional.includes(member)))
                            )
                        {
                            let groupMember={member: member,
                                             group: group,};
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
        let contentGroup : AuraEnabledGroupContent={title: group.title,
                          name: group.name, 
                          description: group.description,
                          link: group.name + '.html',
                          auraenabled : [],
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
                if (mem.member.componentType === 'aura') {
                    this.extractDetailsAura(mem.member, contentGroup);
                }
                else {
                    this.extractDetailsLWC(mem.member, contentGroup);
                }
            }
        }
    }

    extractDetailsAura(member, contentGroup) {
        const body = readFileSync(join(this.sourceDir, 'aura', member.name, member.name + '.cmp'), 'utf-8');

        // console.log('Body = ' + body);
        const pos = body.indexOf('<aura:component ');

        let controllerPos = body.indexOf('controller="', pos);
        if (-1!=controllerPos) {
            controllerPos+=12;
            const endPos = body.indexOf('"', controllerPos);

            const controller = body.slice(controllerPos, endPos);

            this.processController(member, controller, contentGroup);
        }
    }

    extractDetailsLWC(member, contentGroup) {
        const body = readFileSync(join(this.sourceDir, 'lwc', member.name, member.name + '.js'), 'utf-8');

        const controllers=[];

        // console.log('Body = ' + body);
        let pos = body.indexOf('@salesforce/apex/');
        while (-1 !== pos) {
            pos += 17;
            const endPos = body.indexOf('.', pos);

            const controller = body.slice(pos, endPos);
            if (-1 === controllers.indexOf(controller)) {
                controllers.push(controller);
                this.processController(member, controller, contentGroup);
            }
            pos = body.indexOf('@salesforce/apex/', endPos);

        }
    }

    processController(member, controller, contentGroup) {
        const classRec = this.profilesAndPermSetsByClassname.get(controller);

        const noAccess = !classRec || (!classRec.profiles && !classRec.permissionsets);

        if (noAccess) {
            this.content.noAccess.push(controller);
        }
        const contentObj: AuraEnabledContent={name: member.name,
            label: member.name,
            background: noAccess ? 'bg-danger' : '',
            controller,
            componentType: member.componentType,
            profiles: (classRec ? classRec.profiles : []),
            permsets: (classRec ? classRec.permissionsets : [])
        };
        contentGroup.auraenabled.push(contentObj);
        this.content.counter++;
    }

}

export {AuraEnabledProcessor};
