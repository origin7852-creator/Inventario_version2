import { createClient } from '@supabase/supabase-js';
import { projectId as _projectId, publicAnonKey as _publicAnonKey } from '../../../utils/supabase/info';

// Las variables de entorno tienen prioridad; si no están definidas, usa las credenciales del archivo info
const projectId: string = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID || _projectId;
const publicAnonKey: string = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || _publicAnonKey;

// Supabase está configurado si hay credenciales reales
export const isSupabaseConfigured = Boolean(projectId && publicAnonKey);

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = publicAnonKey;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== GESTIÓN DE USUARIOS ====================

export async function hashPassword(password: string): Promise<string> {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${salt}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, storedHash] = stored.split(':');
  if (!salt || !storedHash) return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === storedHash;
}

export async function getUsers() {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error al obtener usuarios:', error);
      return [];
    }
    
    return data || [];
  } catch (networkError) {
    console.warn('Error de red al obtener usuarios:', networkError);
    return [];
  }
}

export async function createUser(userData: any) {
  if (!isSupabaseConfigured) throw new Error('Supabase no está configurado');
  // Verificar si el email ya existe
  const { data: existingUsers } = await supabase
    .from('users')
    .select('email')
    .eq('email', userData.email);
  
  if (existingUsers && existingUsers.length > 0) {
    throw new Error('El correo electrónico ya está registrado');
  }
  
  const newUser = {
    name: userData.name,
    email: userData.email,
    password: await hashPassword(userData.password), // En producción, hashear la contraseña
    role: userData.role || 'usuario',
    department: userData.department || '',
    status: userData.status || 'active',
    created_at: new Date().toISOString(),
    is_active: true,
  };
  
  const { data, error } = await supabase
    .from('users')
    .insert([newUser])
    .select()
    .single();
  
  if (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
  
  return data;
}

export async function loginUser(email: string, password: string) {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase no está configurado' };
  try {
    const { data: usersData, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase());

    if (error) {
      return { success: false, error: 'Error al iniciar sesión. Inténtalo de nuevo.' };
    }

    if (!usersData || usersData.length === 0) {
      return { success: false, error: 'Correo o contraseña incorrectos.' };
    }

    const user = usersData[0];

    if (user.is_active === false) {
      return { success: false, error: 'Tu cuenta está desactivada. Contacta al administrador.' };
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return { success: false, error: 'Correo o contraseña incorrectos.' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'usuario',
      }
    };
  } catch (error) {
    return { success: false, error: 'Error inesperado al iniciar sesión.' };
  }
}

export async function resetPasswordDirect(email: string, newPassword: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase no está configurado');

  const { data: usersData, error: findError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase());

  if (findError || !usersData || usersData.length === 0) {
    throw new Error('No se encontró ninguna cuenta con ese correo electrónico.');
  }

  const hashedPassword = await hashPassword(newPassword);

  const { error: updateError } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('email', email.toLowerCase());

  if (updateError) throw updateError;

  return { success: true };
}

export async function updateUser(userId: string, userData: any) {
  if (!isSupabaseConfigured) throw new Error('Supabase no está configurado');
  // Convertir camelCase a snake_case para la base de datos
  const dbData: any = {};
  
  if (userData.name !== undefined) dbData.name = userData.name;
  if (userData.email !== undefined) dbData.email = userData.email;
  if (userData.role !== undefined) dbData.role = userData.role;
  if (userData.department !== undefined) dbData.department = userData.department;
  if (userData.status !== undefined) dbData.status = userData.status;
  if (userData.password !== undefined) dbData.password = await hashPassword(userData.password);
  
  // Convertir isActive a is_active
  if (userData.isActive !== undefined) dbData.is_active = userData.isActive;
  
  const { data, error } = await supabase
    .from('users')
    .update(dbData)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
  
  return data;
}

export async function deleteUser(userId: string) {
  if (!isSupabaseConfigured) throw new Error('Supabase no está configurado');
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  
  if (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
  
  return { success: true };
}

// ==================== GESTIÓN DE AVATARES ====================

export async function getUserAvatar(userId: string): Promise<string | null> {
  try {
    const data = await getKVData(`user_avatar_${userId}`);
    return data || null;
  } catch {
    return null;
  }
}

export async function saveUserAvatar(userId: string, avatarBase64: string) {
  return await setKVData(`user_avatar_${userId}`, avatarBase64);
}

// ==================== GESTIÓN DE DATOS (KV Store) ====================

// Nombre de la tabla KV Store (con sufijo único de Figma Make)
const KV_STORE_TABLE = 'kv_store_0c8a700a';

export async function getKVData(key: string) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from(KV_STORE_TABLE)
      .select('value')
      .eq('key', key)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró el registro, devolver null
        return null;
      }
      console.error(`Error al obtener ${key}:`, error);
      // Devolver null en lugar de lanzar para que los callers puedan usar defaults
      return null;
    }
    
    return data?.value;
  } catch (networkError) {
    // Error de red (TypeError: Failed to fetch) u otro error inesperado
    // Se devuelve null para que todos los callers puedan caer en sus valores por defecto
    console.warn(`Error de red al obtener ${key}:`, networkError);
    return null;
  }
}

export async function setKVData(key: string, value: any) {
  if (!isSupabaseConfigured) throw new Error('Supabase no está configurado');
  const { error } = await supabase
    .from(KV_STORE_TABLE)
    .upsert({
      key,
      value
    });
  
  if (error) {
    console.error(`Error al guardar ${key}:`, error);
    throw error;
  }
  
  return { success: true };
}

// ==================== GESTIÓN DE PRODUCTOS ====================

export async function getProducts(company: string) {
  return await getKVData(`products_${company}`) || [];
}

export async function saveProducts(company: string, products: any[]) {
  return await setKVData(`products_${company}`, products);
}

export async function getDeletedProducts(company: string) {
  return await getKVData(`deleted_products_${company}`) || [];
}

export async function saveDeletedProducts(company: string, deletedProducts: any[]) {
  return await setKVData(`deleted_products_${company}`, deletedProducts);
}

// ==================== GESTIÓN DE CATEGORÍAS ====================

export async function getCategories(company: string) {
  return await getKVData(`categories_${company}`) || [];
}

export async function saveCategories(company: string, categories: any[]) {
  return await setKVData(`categories_${company}`, categories);
}

// ==================== GESTIÓN DE PROVEEDORES ====================

export async function getSuppliers(company: string) {
  return await getKVData(`suppliers_${company}`) || [];
}

export async function saveSuppliers(company: string, suppliers: any[]) {
  return await setKVData(`suppliers_${company}`, suppliers);
}

// ==================== GESTIÓN DE EMPLEADOS ====================

export async function getEmployees() {
  return await getKVData('employees') || [];
}

export async function saveEmployees(employees: any[]) {
  return await setKVData('employees', employees);
}

// ==================== GESTIÓN DE ALMACENES ====================

export async function getWarehouses(company: string) {
  return await getKVData(`warehouses_${company}`) || [];
}

export async function saveWarehouses(company: string, warehouses: any[]) {
  return await setKVData(`warehouses_${company}`, warehouses);
}

// ==================== CONFIGURACIÓN DE EMPRESA ====================

export async function getSelectedCompany() {
  return await getKVData('selectedCompany') || 'AMS';
}

export async function saveSelectedCompany(company: string) {
  return await setKVData('selectedCompany', company);
}

// ==================== GESTIÓN DE ROLES Y PERMISOS ====================

export async function getRolePermissions() {
  const [moduleAccess, crudPermissions, specialFeatures, financialAccess, customRoles] = await Promise.all([
    getKVData('rolePermissions_moduleAccess'),
    getKVData('rolePermissions_crudPermissions'),
    getKVData('rolePermissions_specialFeatures'),
    getKVData('rolePermissions_financialAccess'),
    getKVData('rolePermissions_customRoles'),
  ]);

  return {
    moduleAccess: moduleAccess || null,
    crudPermissions: crudPermissions || null,
    specialFeatures: specialFeatures || null,
    financialAccess: financialAccess || null,
    customRoles: customRoles || null,
  };
}

export async function saveModuleAccess(data: any) {
  return await setKVData('rolePermissions_moduleAccess', data);
}

export async function saveCrudPermissions(data: any) {
  return await setKVData('rolePermissions_crudPermissions', data);
}

export async function saveSpecialFeatures(data: any) {
  return await setKVData('rolePermissions_specialFeatures', data);
}

export async function saveFinancialAccess(data: any) {
  return await setKVData('rolePermissions_financialAccess', data);
}

export async function saveCustomRoles(data: any) {
  return await setKVData('rolePermissions_customRoles', data);
}

// ==================== SINCRONIZACIÓN COMPLETA ====================

export async function syncAll() {
  const companies = ['AMS', 'CEM', 'RUGH', 'SADAF'];
  
  const [rolePermissions, employees, selectedCompany, ...companyData] = await Promise.all([
    getRolePermissions(),
    getEmployees(),
    getSelectedCompany(),
    ...companies.flatMap(company => [
      getProducts(company),
      getCategories(company),
      getSuppliers(company),
      getWarehouses(company),
    ]),
  ]);

  const response: any = {
    rolePermissions,
    employees,
    selectedCompany,
  };

  // Organizar datos por empresa
  companies.forEach((company, index) => {
    const baseIndex = index * 4;
    response[company] = {
      products: companyData[baseIndex] || [],
      categories: companyData[baseIndex + 1] || [],
      suppliers: companyData[baseIndex + 2] || [],
      warehouses: companyData[baseIndex + 3] || [],
    };
  });

  return response;
}