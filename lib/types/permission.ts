   // lib/types/permission.ts
   export interface Permission {
    id?: string;
    name: string;
  }

  export interface RolePermission {
    role_id?: string;
    permission_id?: string;
    permissions: Permission;
  }

  export interface Role {
    id?: string;
    name?: string;
    role_permissions: RolePermission[];
  }

  export interface UserRole {
    user_id?: string;
    role_id: number;
    roles: {
      role_permissions: {
        permissions: {
          name: string;
        }[];
      }[];
    };
  }