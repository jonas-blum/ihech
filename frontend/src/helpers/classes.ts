interface DimRedPosition {
    x: number;
    y: number;
}

export abstract class Row {
    name: string;
    data: number[];
    visible: boolean;
    dimRedPosition: DimRedPosition;
    children: Row[];
    parent: Row | null;
    position: number;
    depth: number;
    prevSibling: Row | null;
    nextSibling: Row | null;

    protected constructor(
        name: string,
        data: number[],
        visible: boolean,
        dimRedPosition: DimRedPosition,
        children: Row[] = [],
        parent: Row | null = null,
        position: number = 0,
        depth: number = 0,
        prevSibling: Row | null = null,
        nextSibling: Row | null = null
    ) {
        this.name = name;
        this.data = data;
        this.visible = visible;
        this.dimRedPosition = dimRedPosition;
        this.children = children;
        this.parent = parent;
        this.position = position;
        this.depth = depth;
        this.prevSibling = prevSibling;
        this.nextSibling = nextSibling;
    }
}

export class ItemRow extends Row {
    constructor(
        name: string,
        data: number[],
        visible: boolean,
        dimRedPosition: DimRedPosition,
        children?: Row[],
        parent?: Row | null,
        position?: number,
        depth?: number,
        prevSibling?: Row | null,
        nextSibling?: Row | null
    ) {
        super(name, data, visible, dimRedPosition, children, parent, position, depth, prevSibling, nextSibling);
    }
}

export class AggregatedRow extends Row {
    constructor(
        name: string,
        data: number[],
        visible: boolean,
        dimRedPosition: DimRedPosition,
        children?: Row[],
        parent?: Row | null,
        position?: number,
        depth?: number,
        prevSibling?: Row | null,
        nextSibling?: Row | null
    ) {
        super(name, data, visible, dimRedPosition, children, parent, position, depth, prevSibling, nextSibling);
    }
}