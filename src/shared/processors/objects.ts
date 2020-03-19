import { join } from 'path';
import { appendFileSync, mkdirSync, readdirSync } from 'fs';
import { readFileSync } from 'fs';
import { lstatSync} from 'fs';
import { writeFileSync } from 'fs';
import { HTMLGenerator } from '../htmlGenerator';
import { fileExists } from '../../shared/files';
import { parse} from 'fast-xml-parser';
import { Metadata, MetadataGroup, DocumentorConfig } from '../types';

class ObjectProcessor {
    groups : Map<string, MetadataGroup>;
    config : DocumentorConfig;
    mdSetup : Metadata;
    counter : number;
    sourceDir : string;
    outputDir : string;
    parentDir : string;
    indexFile : string;
    generator : HTMLGenerator;
    groupFile : string;
    standardValueSetByField : object;

    constructor(config, sourceDir, outputDir, generator) {
    
        generator.indexLink(join(outputDir, 'index.html'), 'objects/objects.html', 'Objects');

        this.config=config;
        this.outputDir=join(outputDir, 'objects');
        if (!fileExists(this.outputDir)) {
            mkdirSync(this.outputDir);
        }
        this.generator=generator;

        this.mdSetup=<Metadata>config['objects'];
        this.groups=this.mdSetup.groups;
        this.parentDir=sourceDir;
        this.sourceDir=sourceDir+this.mdSetup.subdirectory;

        this.indexFile=join(this.outputDir, '/objects.html');
        generator.startPage(this.indexFile, 2);
        generator.metadataHeader(this.indexFile, this.mdSetup.description);
    
        this.counter=0;
        this.standardValueSetByField={
            "AccountContactRelation.Roles":"AccountContactMultiRoles",
            "AccountContactRole.Role":"AccountContactRole",
            "Account.Ownership":"AccountOwnership",
            "Account.Rating":"AccountRating",
            "Lead.Rating":"AccountRating",
            "Account.Type":"AccountType",
            "Asset.Status":"AssetStatus",
            "CampaignMember.Status":"CampaignMemberStatus",
            "Campaign.Status":"CampaignStatus",
            "Campaign.Type":"CampaignType",
            "CaseContactRole.Role":"CaseContactRole",
            "Case.Origin":"CaseOrigin",
            "Case.Priority":"CasePriority",
            "Case.Reason":"CaseReason",
            "Case.Status":"CaseStatus",
            "Case.Type":"CaseType",
            "OpportunityContactRole.Role":"ContactRole",
            "ContractContactRole.Role":"ContractContactRole",
            "Contract.Status":"ContractStatus",
            "Entitlement.Type":"EntitlementType",
            "Event.Subject":"EventSubject",
            "Event.Type":"EventType",
            "Period.PeriodLabel":"FiscalYearPeriodName",
            "FiscalYearSettings.PeriodPrefix":"FiscalYearPeriodPrefix",
            "Period.QuarterLabel":"FiscalYearQuarterName",
            "FiscalYearSettings.QuarterPrefix":"FiscalYearQuarterPrefix",
            "IdeaTheme.Categories1":"IdeaCategory1",
            "Idea.Categories":"IdeaMultiCategory",
            "Idea.Status":"IdeaStatus",
            "IdeaTheme.Status":"IdeaThemeStatus",
            "Account.Industry":"Industry",
            "Lead.Industry":"Industry",
            "Account.AccountSource":"LeadSource",
            "Lead.LeadSource":"LeadSource",
            "Lead.Status":"LeadStatus",
            "Opportunity.Competitors":"OpportunityCompetitor",
            "Opportunity.Source":"LeadSource",
            "Opportunity.StageName":"OpportunityStage",
            "Opportunity.Type":"OpportunityType",
            "Order.Type":"OrderType",
            "Account.PartnerRole":"PartnerRole",
            "Product2.Family":"Product2Family",
            "Question.Origin1":"QuestionOrigin1",
            "QuickText.Category":"QuickTextCategory",
            "QuickText.Channel":"QuickTextChannel",
            "Quote.Status":"QuoteStatus",
            "UserTerritory2Association.RoleInTerritory2":"RoleInTerritory2",
            "OpportunityTeamMember.TeamMemberRole":"SalesTeamRole",
            "OpportunityTeamMember.UserAccountTeamMember":"SalesTeamRole",
            "OpportunityTeamMember.UserTeamMember":"SalesTeamRole",
            "OpportunityTeamMember.AccountTeamMember":"SalesTeamRole",
            "Contact.Salutation":"Salutation",
            "Lead.Salutation":"Salutation",
            "ServiceContract.ApprovalStatus":"ServiceContractApprovalStatus",
            "SocialPost.Classification":"SocialPostClassification",
            "SocialPost.EngagementLevel":"SocialPostEngagementLevel",
            "SocialPost.ReviewedStatus":"SocialPostReviewedStatus",
            "Solution.Status":"SolutionStatus",
            "Task.Priority":"TaskPriority",
            "Task.Status":"TaskStatus",
            "Task.Subject":"TaskSubject",
            "Task.Type":"TaskType",
            "WorkOrderLineItem.Status":"WorkOrderLineItemStatus",
            "WorkOrder.Priority":"WorkOrderPriority",
            "WorkOrder.Status":"WorkOrderStatus"
        };
    }

    process() {
        this.expandGroups();
        for (let groupName in this.groups) {
            if (this.groups.hasOwnProperty(groupName)) {
                let group=this.groups[groupName];
                this.startGroup(group);
                this.processGroup(group);
                this.endGroup(group);
            }
        }

        appendFileSync(this.indexFile,
            '    </table>\n' +
            '  <h1>' + this.counter + ' objects processed</h1>');
    }

    expandGroups() {
        // first get all of the members from the metadata directory
        this.mdSetup.members=[];
        let entries=readdirSync(this.sourceDir);
        for (let idx=0, len=entries.length; idx<len; idx++) {
            let entry=entries[idx];
            let dirPath=join(this.sourceDir, entries[idx]);
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
                group.menu={content:"<h2>Menu</h2><ul>"};
                if ('other'!=groupName) {
                    // expand the members based on prefixes/literals
                    for (let member of this.mdSetup.members) {
                        if ( ((group.objects) && (group.objects.includes(member.name))) ) {
                            let groupMember={member: member,
                                             groupMenu: group.menu,
                                             group: group};
                            group.members.push(groupMember);
                        }
                    }    
                }
            }
        }

        // add everything to the catch-all group
        let group=this.groups['other'];
        group.menu={content:"<h2>Menu</h2><ul>"};
        group.members=[];
        for (let member of this.mdSetup.members) {
            var groupMember={member: member,
                             groupMenu: group.menu,
                            group: group};
            group.members.push(groupMember);
        }
    }

    startGroup(group : MetadataGroup) {
        group.started=true;
        this.groupFile=join(this.outputDir, group.name+'.html');
        this.generator.groupLink(this.indexFile, group.title, group.name);
    
        this.generator.startPage(this.groupFile, 2);    
        this.generator.groupTitle(this.groupFile, group.title, group.description);
    }

    endGroup(group : MetadataGroup) {
        this.generator.endPage(this.groupFile);
        group.menu.content+='</ul>\n';
        var body=readFileSync(this.groupFile, 'utf-8');
        body=body.toString().replace(/{menu}/, group.menu.content);
        writeFileSync(this.groupFile, body);
    }

    processGroup(group : MetadataGroup) {
        for (let mem of group.members) {
            if (!mem.member.processed) {
                this.counter++;
                mem.member.processed=true;
                // load the object definition file
                let obj=''+readFileSync(join(mem.member.subdir, mem.member.name + '.object-meta.xml'));
                let md=parse(obj);

                let label=md.CustomObject.label||mem.member.name;
                mem.groupMenu.content+='<li><a style="font-size: 1.2em;" href="#' + mem.member.name + '">' + label + '</a></li>\n';

                this.generator.objectHeader(this.groupFile, mem.member.name, label, md.CustomObject.description);

                let fieldsDir=join(mem.member.subdir, 'fields');
                if ( (fileExists(fieldsDir)) && (lstatSync(fieldsDir).isDirectory()) ) {
                    let fields=readdirSync(fieldsDir);
                    for (let idx=0, len=fields.length; idx<len; idx++) {
                        let field=fields[idx];
                        let fieldFile=join(fieldsDir, field);
                        let fld=''+readFileSync(fieldFile);
                        let fldMd=parse(fld);
                        this.enrichField(mem.member.name, fldMd.CustomField, md.CustomObject);
                        appendFileSync(this.groupFile,
                                this.outputField(fldMd.CustomField, md));
                    }
                }
                    
                appendFileSync(this.groupFile,
                                '</table>');
            }
        }
    }

    enrichField(objectName, field, object) {
        var fqName=objectName+'.'+field.fullName;
        field.svsName=this.standardValueSetByField[fqName];
        if (field.svsName) {
            field.standardValueSet=true;
            try{
                var body=readFileSync(join(this.parentDir, 'standardValueSets', field.svsName+'.standardValueSet-meta.xml')).toString();
                field.svs = parse(body);
            }
            catch(e) {
                console.log('Error ' + e);
            }
        }
        else if (field.valueSet) {
            if (field.valueSet.valueSetName) {
                var vsName=field.valueSet.valueSetName;
                field.globalValueSet=true;
                var gvsFileName=join(this.parentDir, 'globalValueSets', vsName+'.globalValueSet-meta.xml');
                var body=readFileSync(gvsFileName).toString();
                field.gvs = parse(body);
            }
        }
    }

    outputField(field, object) {
        var name=field.fullName.toString();
        if ( (!field.label) && (-1==name.indexOf('__c')) ) {
            field.label='N/A (standard field)';
        }
    
        if ( (!field.description) && (-1==name.indexOf('__c')) ) {
            field.description='N/A (standard field)';
        }
        
        let background='';  // change this if we need to callout anything
        if (typeof field.description === 'undefined') {
            background='orange';
        }
        else {
            let todoPos;
            let descStr=field.description.toString().toLowerCase();
            if (-1!=(todoPos=descStr.indexOf('todo'))) {
                if (this.config.redact) {
                    field.description=descStr.substring(0, todoPos);
                }
                else {
                    background='#f4e241';
                }
            }
            else if (-1!=descStr.indexOf('deprecated')) {
                background='#f28a8a';
            }
        }
    
        field.background=background;
    
        var type=field.type;
        if (type) {
            type=type.toString();
            if (field.formula) {
                type='Formula (' + type + ')';
            }
            else if (type=='Html') {
                type='Rich TextArea';
            }
        }
        else {
            type="N/A (standard field)";
        }
    
        field.fullType=type;

        let fldBody=
            '      <tr style="background-color:' + field.background + '">\n' +
            '        <td>' + field.fullName + '</td>\n' +
            '        <td>' + field.label + '</td>\n' +
            '        <td>' + field.fullType + '</td>\n' +
            '        <td>' + field.description + '</td>\n' +
            '        <td>' + this.getAdditionalFieldInfo(field, field.fullType, object.name) + '</td>\n';

        fldBody+=
            '      </tr>\n';

        return fldBody;
    }

    getAdditionalFieldInfo(field, type, objectName) {
        var result='';
        if (type) {
            switch (type.toString()) {
                case 'Lookup':
                    result += '<strong>Lookup</strong> : ' + field.referenceTo;
                    break;
        
                case 'MasterDetail':
                    result += '<strong>Master-Detail</strong> : ' + field.referenceTo;
                    break;
        
                case 'Summary':
                    result += '<strong>Roll Up Summary</strong> : ' + field.summaryOperation + '(' + field.summaryForeignKey + ')';
                    break;
        
                case 'Html':
                case 'LongTextArea':
                    result += '<strong>Length</strong> : ' + field.length + '<br/>';
                    result += '<strong>Visible Lines</strong> : ' + field.visibleLines;
                    break;
    
                case 'Picklist':
                case 'MultiselectPicklist':
                    if (field.standardValueSet) {
                        result+='<b>Standard Value Set (' + field.svsName + ')</b><br/>';
                        if (field.svs) {
                            if (field.svs.StandardValueSet.standardValue) {
                                for (var idx=0; idx<field.svs.StandardValueSet.standardValue.length; idx++) {
                                    var value=field.svs.StandardValueSet.standardValue[idx].fullName + '<br/>';
                                    result+='&nbsp;&nbsp;' + value;
                                }
                            }
                        }
                        else {
                            result+='Not version controlled';
                        }
                    }
                    else if (field.valueSet) {
                        if (field.globalValueSet) {
                            var vsName=field.valueSet.valueSetName;
                            result+='<b>Global Value Set (' + vsName +')</b><br/>';
                            if (field.gvs) {
                                for (var idx=0; idx<field.gvs.GlobalValueSet.customValue.length; idx++) {
                                    var value=field.gvs.GlobalValueSet.customValue[idx].fullName + '<br/>';
                                    result+='&nbsp;&nbsp;' + value;
                                }
                            }
                            else {
                                result+='Not version controlled';
                            }
                        }
                        else if (field.valueSet.valueSetDefinition) {
                            result+='<b>Values</b><br/>';
                            for (var idx=0; idx<field.valueSet.valueSetDefinition.value.length; idx++) {
                                var value=field.valueSet.valueSetDefinition.value[idx].fullName + '<br/>';
                                result+='&nbsp;&nbsp;' + value;
                            }
                        }
                    }
                    break;
                case 'Text':
                    result += '<strong>Length</strong> : ' + field.length;
                    break;
    
                default:
                    if (field.formula) {
                        result+='<strong>Formula</strong>: <br/>' + field.formula;
                    }
            }
        }
    
        return result;
    }
}

export {ObjectProcessor}