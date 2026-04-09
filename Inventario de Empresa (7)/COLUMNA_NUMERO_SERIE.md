# Nueva Columna "Nº de serie" en Plantilla de Importación

## ✅ Cambios Implementados

Se ha añadido una nueva columna **"Nº de serie"** a la plantilla de importación de productos Excel y se ha **eliminado la columna "Precio"**.

### 📋 ¿Qué hace esta columna?

Esta columna permite indicar si un producto requiere número de serie o no durante el proceso de importación masiva desde Excel.

### 🔧 Valores Aceptados

- **"Si"** o **"Sí"** o **"yes"**: El producto se marcará como que **requiere número de serie** (`hasSerialNumber: true`)
- **"No"** (valor por defecto): El producto **NO requiere número de serie** (`hasSerialNumber: false`)

### 📝 Columnas de la Plantilla Actualizada

La plantilla ahora contiene las siguientes columnas (sin incluir Precio):

```
| Nombre | SKU | Categoría | Empresa | Departamento | Proveedor | Almacén | Stock | Stock Mínimo | Descripción | Nº de serie |
|--------|-----|-----------|---------|--------------|-----------|---------|-------|--------------|-------------|-------------|
```

### 🎯 Ejemplo de Uso

```excel
Nombre              | SKU     | Categoría    | Empresa | ... | Stock | Descripción              | Nº de serie
--------------------|---------|--------------|---------|-----|-------|--------------------------|------------
Laptop Dell XPS     | LT-001  | Electrónica  | AMS     | ... | 5     | Laptop empresarial       | Si
Cable USB-C         | CB-002  | Accesorios   | AMS     | ... | 20    | Cable de carga           | No
Monitor Samsung 27" | MO-003  | Electrónica  | CEM     | ... | 8     | Monitor profesional      | Si
```

### 💡 Funcionalidad

Cuando se importa un producto con "Nº de serie" = "Si":
- El producto queda marcado como que requiere número de serie
- Al aumentar el stock de este producto, el sistema pedirá registrar los números de serie individuales
- Se aplicarán las validaciones de número de serie al gestionar sus unidades

### 📍 Archivos Modificados

1. **`/src/app/components/InventoryView.tsx`**:
   - `handleDownloadTemplate()`: Añadida la columna "Nº de serie" con valor por defecto "No" y **eliminada la columna "Precio"**
   - `handleImportFile()`: Añadida lógica para procesar el valor de la columna y asignarlo al campo `hasSerialNumber`

2. **`/src/app/components/HelpView.tsx`**:
   - Añadida nueva pregunta frecuente: "¿Cómo importo productos desde Excel?"
   - Documenta todas las columnas de la plantilla, incluyendo "Nº de serie" (sin "Precio")

### 🚀 Cómo Usar

1. Ve a **Inventario → Configuración (⚙️) → Descargar Plantilla**
2. La plantilla descargada ya incluye la columna "Nº de serie" con valor de ejemplo "No" (sin columna Precio)
3. Completa la plantilla con tus productos
4. En la columna "Nº de serie", escribe "Si" para productos que requieren número de serie
5. Importa el archivo desde **Inventario → Configuración (⚙️) → Importar desde Excel**

### ⚠️ Importante

- La columna acepta variantes: "Si", "Sí", "yes" (no distingue mayúsculas/minúsculas)
- Si la columna está vacía o contiene cualquier otro valor, se interpreta como "No"
- Esta configuración se aplica a nivel de producto y determina cómo se gestionará su inventario
- **Nota sobre Precio**: Aunque la columna "Precio" no aparece en la plantilla oficial, el sistema mantiene compatibilidad con archivos antiguos que la incluyan. Los productos importados sin precio se asignarán con precio 0 por defecto.

---

**Fecha de implementación**: Abril 2026  
**Sistema**: Gestión de Inventario Empresarial