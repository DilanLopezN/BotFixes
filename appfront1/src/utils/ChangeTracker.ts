export const createChangeTracker = (obj, onChange) => {
    return new Proxy(obj, {
        get(target, property, receiver) {
            return Reflect.get(target, property, receiver);
        },
        set(target, property, value, receiver) {
            if (Array.isArray(target[property]) && Array.isArray(value)) {
                if (JSON.stringify(target[property]) === JSON.stringify(value)) {
                    return true; // Não há alteração no conteúdo do array
                }
            }

            if (target[property] !== value) {
                onChange(property, value);
            }

            return Reflect.set(target, property, value, receiver);
        },
    });
}

export const hasChangedFields = (obj: any, oldObj: any, fields: string[]) => {
    let modifiedFields = {};
    
    const trackedObj = createChangeTracker(oldObj, (property, value) => {
        modifiedFields[property] = value;
    });

    for (const field of fields) {
        trackedObj[field] = obj[field];
    }

    return !!Object.keys(modifiedFields).length;
}

