const filteredList = (menuList, UserPermission) => {
    return (menuList as any[]).map((listItem) => {
        if (listItem?.list?.length > 0) {
            const filteredList = listItem.list.filter((e) => {
                return e.roles ? UserPermission.can(e.roles as any[]) : true;
            });

            if (filteredList.length > 0) {
                return {
                    ...listItem,
                    list: filteredList,
                };
            }
        } else if (!listItem.roles || listItem?.roles.length < 1) {
            return listItem;
        } else if (UserPermission.can(listItem.roles ?? [])) {
            return listItem;
        }

        return undefined;
    });
};

export { filteredList };
