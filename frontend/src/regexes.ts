export function id_regex_test(s:string){
    return /^[a-z0-9_][a-z0-9_.@-]+$/.test(s) || 
    `Identifiers must consist entirely of lowercase letters, underscores, dashes, @signs, or periods, 
    and must start with a letter, number, or underscore`
}
export function password_regex_test(s:string){
    return /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/.test(s) || 
    `Password too weak. Password must be at least 8 characters long and have at least 
    1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol`
}