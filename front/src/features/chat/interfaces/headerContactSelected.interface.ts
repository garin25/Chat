export interface HeaderContactSelected{
    avatar_url:string,
    nombre:string,
    estado:string|null|undefined,
    usuario_id ?: number | null,
    tipo:string
    esContacto?:boolean
}