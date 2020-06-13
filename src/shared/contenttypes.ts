interface IndexContent {
    links: Array<ContentLink>;
}

interface ContentLink {
    title: string;
    href: string;
    image?: string;
    description: string;
    warning: boolean;
    error: boolean;
}

interface ObjectsContent {
    description: string;
    counter: number;
    groups: Array<ObjectGroupContent>;
    missingDescriptions: Array<String>;
    footer?: object;
}

interface ObjectGroupContent {
    name: string;
    title: string,
    description: string,
    link: string,
    objects : Array<ObjectContent>,
    menuItems : Array<ContentLink>
}

interface ObjectContent {
    name: string;
    label: string;
    sfObject: object;
    fields: Array<ObjectFieldContent>;
    validationRules: Array<object>;
    recordTypes: Array<Object>;
}

interface ObjectFieldContent {
    fullName: string;
    label: string;
    background: string;
    fullType: string;
    description: string;
    sfField: object;
    additionalInfo: string;
}

interface PumlEntity {
    name: string;
    fields: Array<PumlField>
}

interface PumlField {
    name: string,
    type: string,
    typeAdditionalInfo?: string
}

interface TriggersContent {
    counter: number;
    groups: Array<TriggerGroupContent>;
    duplicates?: Array<TriggerDuplicate>;
    footer?: object;
}

interface TriggerGroupContent {
    name: string;
    title: string,
    description: string,
    link: string,
    triggers : Array<TriggerContent>,
    menuItems : Array<ContentLink>
}

interface TriggerContent {
    name: string;
    label: string;
    trigger: string;
    triggerMeta: object;
    actions?: string;
    objectName?: string;

}

interface TriggerDuplicate {
    objectName : string;
    action : string;
    triggers: string;
}

export {IndexContent, ContentLink, ObjectsContent, ObjectGroupContent, ObjectContent, ObjectFieldContent, PumlEntity, PumlField, TriggersContent, TriggerGroupContent, TriggerContent, TriggerDuplicate}