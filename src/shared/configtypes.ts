interface DocumentorConfig {
    redact: boolean;
    version: string;
    title: string;
    subtitle: string;
    backgroundColor : string;
    color: string;
}

interface MetadataMember {
    name: string;
    processed: boolean;
    started?: boolean;
    subdir: string;
    componentType?: string;
}

interface MetadataGroupMember {
    name: string;
    processed: boolean;
    started?: boolean;
    member: MetadataMember;
    groupMenu: MetadataGroupMenu;
}

interface MetadataGroupMenu {
    content: string;
}

interface MetadataGroup {
    name: string;
    title: string;
    description: string;
    started: boolean;
    menu: MetadataGroupMenu;
    backgroundColor: string;
    color: string;
    members: Array<MetadataGroupMember>
}

interface Metadata {
    groups: Map<string, MetadataGroup>;
    subdirectory: string;
    description: string;
    image: string;
    members: Array<MetadataMember>;
    backgroundColor: string;
    color: string;
};

export {Metadata, MetadataGroup, MetadataGroupMember, DocumentorConfig}