interface DocumentorConfig {
    redact: boolean;
    version: string;
}

interface MetadataMember {
    name: string;
    processed: boolean;
    started?: boolean;
    subdir: string;
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
    members: Array<MetadataGroupMember>
}

interface Metadata {
    groups: Map<string, MetadataGroup>;
    subdirectory: string;
    description: string;
    members: Array<MetadataMember>;
};

export {Metadata, MetadataGroup, MetadataGroupMember, DocumentorConfig}