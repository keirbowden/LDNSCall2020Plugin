interface IndexContent {
    links: Array<ContentLink>;
    title: string;
    subtitle: string;
    header: HeaderStyle;
}

interface HeaderStyle {
    backgroundColor: string;
    color: string;
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
    header: HeaderStyle;
    footer?: object;
    columns?:Array<String>;
}

interface ObjectGroupContent {
    name: string;
    title: string,
    description: string,
    header: HeaderStyle;
    link: string,
    objects : Array<ObjectContent>,
    columns?:Array<String>;
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
    pageLayoutInfo?: ObjectPageLayoutData[];
    securityClassification: string;
    complianceGroup: string;
    businessStatus: string;
    encrypted: string;
}

interface TriggersContent {
    counter: number;
    groups: Array<TriggerGroupContent>;
    duplicates?: Array<TriggerDuplicate>;
    header: HeaderStyle;
    footer?: object;
}

interface TriggerGroupContent {
    name: string;
    title: string,
    description: string,
    link: string,
    triggers : Array<TriggerContent>,
    header: HeaderStyle;
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


interface AuraEnabledHeaderContent {
    counter: number;
    groups: Array<AuraEnabledGroupContent>;
    noAccess: string[];
    footer?: object;
    header: HeaderStyle;
}

interface AuraEnabledGroupContent {
    name: string;
    title: string,
    description: string,
    link: string,
    auraenabled : Array<AuraEnabledContent>,
    menuItems : Array<ContentLink>
    header: HeaderStyle;
}

interface AuraEnabledContent {
    name: string;
    label: string;
    controller: string;
    componentType: string;
    background: string;
    profiles: string[];
    permsets: string[];
}

interface ObjectPageLayoutData {
    layoutName: string;
    objectName: string;
    fieldName: string;
    behavior: string;
}

export {IndexContent, ContentLink, ObjectsContent, ObjectGroupContent, ObjectContent, ObjectFieldContent, TriggersContent, TriggerGroupContent, TriggerContent, TriggerDuplicate,
    AuraEnabledHeaderContent, AuraEnabledGroupContent, AuraEnabledContent, ObjectPageLayoutData}