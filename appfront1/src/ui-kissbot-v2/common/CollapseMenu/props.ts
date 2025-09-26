export interface CollapseMenuProps {
    title: String;
    itens: Array<ItemCollapseMenu>;
}

interface ItemCollapseMenu {
    label: String;
    subItens: Array<SubItemCollapseMenu>
}

interface SubItemCollapseMenu {
    label: String;
    onClick?: Function;
}