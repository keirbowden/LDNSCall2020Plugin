import { join } from 'path';
import { parseXMLToJS } from './files';

let globalValueSetByName={};
let standardValueSetByName={};

let standardValueSetNameByField={
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

let getStandardValueSetName = (fieldName) => {
    return standardValueSetNameByField[fieldName];
}

let getStandardValueSet = (dir, name) => {
    let valueSet=standardValueSetByName[name];
    if (null==valueSet) {
        standardValueSetByName[name] = valueSet = parseXMLToJS(join(dir, 'standardValueSets', valueSet+'.standardValueSet-meta.xml'));
    }

    return valueSet;    
}

let getGlobalValueSet = (dir, name) => {
    let valueSet=globalValueSetByName[name];
    if (null==valueSet) {
        globalValueSetByName[name] = valueSet = parseXMLToJS(join(dir, 'globalValueSets', name + '.globalValueSet-meta.xml'));
    }

    return valueSet;
}

export {getStandardValueSetName, getStandardValueSet, getGlobalValueSet}