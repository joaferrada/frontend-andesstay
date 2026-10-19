// App roles definidos en Entra ID (llegan en el claim "roles" del token)
export enum UserRole {
  Admin = 'Admin',
  Operador = 'Operador_Dominio',
  Cliente = 'Cliente_Dominio',
  Auditor = 'Auditor'
}

export const ALL_ROLES: UserRole[] = [
  UserRole.Admin,
  UserRole.Operador,
  UserRole.Cliente,
  UserRole.Auditor
];

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Admin]: 'Administrador',
  [UserRole.Operador]: 'Recepción',
  [UserRole.Cliente]: 'Huésped',
  [UserRole.Auditor]: 'Auditor'
};
