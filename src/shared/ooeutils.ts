import { truncateSync } from "fs";

/*
 * Check if a file/directory exists
 */
let getSteps = () => {
    let steps=new Map();
    steps.set(1, {index: 1, 
                    name: 'Load Record',
                    description: 'Loads the original record from the database or initializes the record for an upsert statement.',
                    items: [],
                    ordered: false,
                    implemented: false,
                    supported: false});

    steps.set(2, {index: 2, 
                    name: 'Overwrite Values',
                    description: 'Loads the new record field values from the request and overwrites the old values.<br/>' + 
                    'If the request came from a standard UI edit page, Salesforce runs system validation to check the record for:<br/>' + 
                    '<ul>' + 
                    '<li>Compliance with layout-specific rules</li>' + 
                    '<li>Required values at the layout level and field-definition level</li>' + 
                    '<li>Valid field formats</li>' + 
                    '<li>Maximum field length</li>' +
                    '</ul> ' + 
                    'When the request comes from other sources, such as an Apex application or a SOAP API call, Salesforce validates only the foreign keys. Before executing a trigger, Salesforce verifies that any custom foreign keys do not refer to the object itself.<br/> ' + 
                    'Salesforce runs custom validation rules if multiline items were created, such as quote line items and opportunity line items.',
                    items: [],
                    ordered: false,
                    implemented: false,
                    supported: true});
    
    steps.set(3, {index: 3, 
                    name: 'Before save flows',
                    description: 'Executes record-triggered flows that are configured to run before the record is saved.',
                    items: [],
                    ordered: true,
                    implemented: true,
                    supported: true});

    steps.set(4, {index: 4, 
                    name: 'Before triggers',
                    description: 'Executes all before triggers.',
                    items: [],
                    ordered: false,
                    implemented: true,
                    supported: true});

    steps.set(5, {index: 5, 
                    name: 'System validation',
                    description: 'Runs most system validation steps again, such as verifying that all required fields have a non-null value, and runs any custom validation rules. The only system validation that Salesforce doesn\'t run a second time (when the request comes from a standard UI edit page) is the enforcement of layout-specific rules.',
                    items: [],
                    ordered: false,
                    implemented: true,
                    supported: true});

    steps.set(6, {index: 6, 
                    name: 'Duplicate rules',
                    description: 'Executes duplicate rules. If the duplicate rule identifies the record as a duplicate and uses the block action, the record is not saved and no further steps, such as after triggers and workflow rules, are taken.',
                    items: [],
                    ordered: false,
                    implemented: false,
                    supported: true});

    steps.set(7, {index: 7, 
                    name: 'Save but not commit',
                    description: 'Saves the record to the database, but doesn\'t commit yet.',
                    items: [],
                    ordered: false,
                    implemented: false,
                    supported: false});

    steps.set(8, {index: 8, 
                    name: 'After triggers',
                    description: 'Executes all after triggers.',
                    items: [],
                    ordered: false,
                    implemented: true,
                    supported: true});

    steps.set(9, {index: 9,
                    name: 'Assignment Rules',
                    description: 'Executes assignment rules.',
                    items: [],
                    ordered: false,
                    implemented: false,
                    supported: true});

    steps.set(10, {index: 10,
                    name: 'Auto-response Rules',
                    description: 'Executes auto-response rules.',
                    items: [],
                    ordered: false,
                    implemented: false,
                    supported: true});

    steps.set(11, {index: 11,
                    name: 'Workflow Rules',
                    description: 'Executes workflow rules. If there are workflow field updates:<br/>' +
                    '<ul>' + 
                    '<li>Updates the record again.</li>' + 
                    '<li>Runs system validations again. Custom validation rules, flows, duplicate rules, processes, and escalation rules are not run again.</li>' + 
                    '<li>Executes before update triggers and after update triggers, regardless of the record operation (insert or update), one more time (and only one more time)</li>' + 
                    '</ul>',
                    items: [],
                    ordered: false,
                    implemented: false,
                    supported: true});

    steps.set(12, {index: 12,
                    name: 'Escalation Rules',
                    description: 'Executes escalation rules.',
                    items: [],
                    ordered: false,
                    implemented: false,
                    supported: true});

    steps.set(13, {index: 13,
                    name: 'Flow Automations',
                    description: 'Executes the following Salesforce Flow automations, but not in a guaranteed order.<br/>' + 
                    '<ul>' + 
                    '<li>Processes</li>' + 
                    '<li>Flows launched by processes</li>' + 
                    '<li>Flows launched by workflow rules (flow trigger workflow actions pilot)</li>' + 
                    '<li>When a process or flow executes a DML operation, the affected record goes through the save procedure.</li>' + 
                    '</ul>',
                    items: [],
                    ordered: false,
                    implemented: false,
                    supported: true});

    steps.set(14, {index: 14,
                    name: 'Entitlement Rules',
                    description: 'Executes entitlement rules',
                    items: [],
                    ordered: false,
                    implemented: false,
                    supported: true});

    steps.set(15, {index: 15,
                    name: 'After Save Flows',
                    description: ' Executes record-triggered flows that are configured to run after the record is saved.',
                    items: [],
                    ordered: true,
                    implemented: true,
                    supported: true});

    steps.set(16, {index: 16,
                    name: 'Roll Up Summaries',
                    description: 'If the record contains a roll-up summary field or is part of a cross-object workflow, performs calculations and updates the roll-up summary field in the parent record. Parent record goes through save procedure.',
                    items: [],
                    ordered: false,
                    implemented: true,
                    supported: true,
                    notes: 'Partially implemented - roll-up summary fields are processed, but not cross-object workflow.'});

    steps.set(17, {index: 17,
                    name: 'Parent Roll Up Summaries',
                    description: 'If the parent record is updated, and a grandparent record contains a roll-up summary field or is part of a cross-object workflow, performs calculations and updates the roll-up summary field in the grandparent record. Grandparent record goes through save procedure.',
                    items: [],
                    ordered: false,
                    implemented: false,
                    supported: true});

    steps.set(18, {index: 18,
                    name: 'Criteria based sharing',
                    description: 'Executes Criteria Based Sharing evaluation',
                    items: [],
                    ordered: false,
                    implemented: false,
                    supported: truncateSync});

    steps.set(19, {index: 19,
                    name: 'Commit',
                    description: 'Commits all DML operations to the database',
                    items: [],
                    ordered: false,
                    implemented: false,
                    supported: false});

    steps.set(20, {index: 20,
                    name: 'Post Commit',
                    description: 'After the changes are committed to the database, executes post-commit logic such as sending email and executing enqueued asynchronous Apex jobs, including queueable jobs and future methods.',
                    items: [],
                    ordered: false,
                    implemented: false,
                    supported: false});

    return steps;
}


export { getSteps }