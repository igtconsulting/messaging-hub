export const validateValueError = (value: string | undefined | null, validators: string[]) => {
    if (value == null || value == undefined) {
        return "Unknown validation error"
    }

    let isError

    for (const validator of validators) {
        switch (validator) {
            case "required":
                isError = isRequiredError(value)
                if (isError) return isError
                break
            case "url":
                isError = isUrlError(value)
                if (isError) return isError
                break
            case "noSpace":
                isError = isNoSpaceError(value);
                if (isError) return isError;
                break;
            case "validPrefix":
                isError = isValidPrefixError(value);
                if (isError) return isError;
                break;
            default:
                console.log("Invalid validation value")
        }
    }
    return null
}

function isRequiredError(value: string) {
    return value.trim() == "" ? "This field is required." : null
}

function isUrlError(value: string) {
    const error = value.startsWith('http://') || value.startsWith('https://')
    return error ? null : "This URL does not match the pattern. URL should start with https:// or http://."
}

function isNoSpaceError(value: string) {
    return /\s/.test(value) ? "This field cannot contain spaces." : null;
}

function isValidPrefixError(value: string) {
    // Check if starts with a number
    if (/^\d/.test(value)) {
        return "Document type prefix cannot start with a number.";
    }
    
    // Check for special characters (only allow alphanumeric and underscores)
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
        return "Document type prefix can only contain letters, numbers, and underscores. Must start with a letter.";
    }
    
    return null;
}