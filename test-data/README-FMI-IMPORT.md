# 📥 Guía de Prueba: Importación de Atributos FMI

Esta guía te ayudará a probar la funcionalidad de importación de atributos FMI desde archivos JSON.

## 🎯 Jugador de Prueba Creado

Se ha creado un jugador de prueba en la base de datos con los siguientes datos:

| Campo | Valor |
|-------|-------|
| **ID Player** | `test_player_2000188850` |
| **Nombre** | Test Player - Jugador Marroquí |
| **Wyscout ID** | `2000188850` |
| **Fecha Nacimiento** | 2003-07-08 |
| **Posición** | LB (Lateral Izquierdo) |
| **Nacionalidad** | Marruecos |
| **Altura** | 177 cm |

---

## 📝 Archivo JSON de Prueba

Se ha creado un archivo JSON de ejemplo en:
```
/test-data/fmi-import-example.json
```

Este archivo contiene todos los atributos FMI del jugador de prueba.

---

## 🧪 Pasos para Probar la Importación

### 1. Acceder a la Página de Admin

1. Asegúrate de estar logueado como **admin**
2. Navega a: `http://localhost:3000/admin/jugadores`

### 2. Localizar el Botón de Importación

En la barra superior de acciones, encontrarás el botón:
```
🔺 Importar FMI JSON
```

### 3. Importar el Archivo

1. Click en el botón **"Importar FMI JSON"**
2. Selecciona el archivo: `/test-data/fmi-import-example.json`
3. Espera a que se procese (aparecerá un spinner)

### 4. Verificar el Resultado

Deberías ver un mensaje de éxito:
```
✅ Importación completada: 1 exitosos, 0 fallidos
✅ Exitosos: 1
❌ Fallidos: 0
```

### 5. Verificar los Datos Importados

La página se recargará automáticamente. Verifica que:

- El campo `total_fmi_pts_norm` se ha calculado automáticamente
- Los atributos se guardaron en la tabla `Atributos`

---

## 🔍 Verificación en Base de Datos

Puedes verificar manualmente en la base de datos:

### Verificar Atributos Importados

```sql
SELECT * FROM "Atributos"
WHERE id_player = 'test_player_2000188850';
```

Deberías ver todos los atributos FMI importados:
- CA: 98
- PA: 112
- Mental Attributes (14 campos)
- Physical Attributes (10 campos)
- Technical Attributes (14 campos)
- Hidden Attributes (5 campos)
- Personality Attributes (8 campos)
- Goalkeeper Attributes (11 campos)

### Verificar Campo Calculado

```sql
SELECT
  id_player,
  player_name,
  total_fmi_pts_norm
FROM "jugadores"
WHERE id_player = 'test_player_2000188850';
```

El campo `total_fmi_pts_norm` debería tener un valor calculado (aproximadamente 50-70).

---

## 📊 Atributos Importados

El archivo JSON contiene:

### Atributos Generales
- CA (Current Ability): 98
- PA (Potential Ability): 112
- RCA: 93
- ActualRating: 58.16
- PotentialRating: 65.43

### Atributos Mentales (14)
- Aggression: 8
- Anticipation: 13
- Bravery: 12
- Composure: 10
- Concentration: 12
- Vision: 12
- Decisions: 9
- Determination: 4
- Flair: 5
- Leadership: 12
- OffTheBall: 12
- Positioning: 10
- Teamwork: 11
- Workrate: 12

### Atributos Físicos (10)
- Acceleration: 13
- Agility: 13
- Balance: 9
- Jumping: 8
- LeftFoot: 20 ⭐ (Zurdo natural)
- NaturalFitness: 13
- Pace: 13
- RightFoot: 6
- Stamina: 10
- Strength: 8

### Atributos Técnicos (14)
- Corners: 10
- Crossing: 15 ⭐ (Muy bueno)
- Dribbling: 11
- Finishing: 4
- FirstTouch: 12
- Freekicks: 7
- Heading: 7
- LongShots: 8
- Longthrows: 10
- Marking: 11
- Passing: 12
- PenaltyTaking: 7
- Tackling: 11
- Technique: 12

### Atributos Ocultos (5)
- Consistency: 13
- Dirtiness: 12
- ImportantMatches: 6
- InjuryProness: 8
- Versatility: 13

### Atributos de Personalidad (8)
- Adaptability: 13
- Ambition: 10
- Loyalty: 11
- Pressure: 12
- Professional: 11
- Sportsmanship: 9
- Temperament: 18 ⭐ (Excelente)
- Controversy: 1

---

## 🧹 Limpieza (Opcional)

Si quieres eliminar el jugador de prueba después de probar:

```sql
-- Eliminar atributos
DELETE FROM "Atributos"
WHERE id_player = 'test_player_2000188850';

-- Eliminar jugador
DELETE FROM "jugadores"
WHERE id_player = 'test_player_2000188850';
```

O ejecutar el script de limpieza:
```bash
npx tsx scripts/delete-test-player.ts
```

---

## ❌ Posibles Errores

### Error: "Jugador con Wyscout ID XXX no encontrado"
**Solución:** Asegúrate de que el jugador existe en la BD con el Wyscout ID correcto.

### Error: "Datos inválidos. El body debe ser JSON válido."
**Solución:** Verifica que el archivo JSON tenga formato válido (usa un validador JSON).

### Error: "Acceso denegado. Solo los administradores pueden importar datos."
**Solución:** Asegúrate de estar logueado como admin (rol: 'admin').

---

## 📚 Recursos Adicionales

- **Endpoint API:** `/api/admin/import-fmi`
- **Componente UI:** `src/components/admin/ImportFMIButton.tsx`
- **Documentación:** `ESTRUCTURA_CAMPOS_JUGADORES.md`

---

**Última actualización:** 2025-01-15
**Creado por:** Sistema de desarrollo Scoutea
