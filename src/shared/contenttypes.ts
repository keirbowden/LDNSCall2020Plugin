interface IndexContent {
    links: Array<ContentLink>;
}

interface ContentLink {
    title: string;
    href: string;
}

interface ObjectsContent {
    counter: number;
    groups: Array<ObjectGroupContent>;
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

export {IndexContent, ContentLink, ObjectsContent, ObjectGroupContent, ObjectContent, ObjectFieldContent}