# Requisitos del Módulo de IA para Pong - PENDIENTE

**Fecha de revisión:** 25 de enero de 2026  
**Estado actual:** ❌ **NO CUMPLE** con los requisitos del módulo Major  
**Archivo afectado:** [`frontend/src/pong.ts`](frontend/src/pong.ts)

---

## 📋 Requisitos del Módulo Major - IA Player

El módulo requiere incorporar un jugador de IA al juego con las siguientes características **obligatorias**:

### 1. ✅ Desarrollar un oponente IA desafiante
- **Estado:** CUMPLIDO
- Existe implementación de IA con 3 niveles de dificultad (Easy/Medium/Hard)

### 2. ❌ NO usar algoritmo A*
- **Estado:** CUMPLIDO
- El código usa seguimiento simple de posición, no A*

### 3. ❌ La IA debe replicar comportamiento humano
**CRÍTICO:** La IA debe simular entrada de teclado, NO modificar directamente la posición del paddle.

- **Estado:** ❌ **NO CUMPLIDO**
- **Problema actual:** La IA modifica `paddle2.y` directamente
- **Requerido:** La IA debe usar `keys['ArrowUp']` y `keys['ArrowDown']` como lo haría un humano

### 4. ❌ Restricción de actualización: 1 vez por segundo
**CRÍTICO:** La IA solo puede refrescar su vista del juego una vez por segundo.

- **Estado:** ❌ **NO CUMPLIDO**
- **Problema actual:** La IA tiene acceso continuo a `ball.y` en cada frame (~60 FPS)
- **Requerido:** La IA debe actualizar su decisión solo cada 1000ms

### 5. ❌ Anticipación de rebotes
**CRÍTICO:** La IA debe anticipar la trayectoria de la bola considerando rebotes.

- **Estado:** ❌ **NO CUMPLIDO**
- **Problema actual:** La IA simplemente persigue `ball.y` de forma reactiva
- **Requerido:** Calcular dónde estará la bola después de rebotar en paredes superiores/inferiores

---

## 🔍 Código Actual (Problemático)

### Ubicación: `frontend/src/pong.ts` (líneas 218-221)

```typescript
if (isAI) {
  const center = paddle2.y + 50;
  if (center < ball.y - 10) paddle2.y += difficulty;
  else if (center > ball.y + 10) paddle2.y -= difficulty;
  paddle2.y = Math.max(0, Math.min(500, paddle2.y));
}
```

### ❌ Problemas identificados:

1. **Modificación directa:** `paddle2.y += difficulty` - No simula teclas
2. **Acceso continuo:** Lee `ball.y` en cada frame (60 veces por segundo)
3. **Sin predicción:** Solo sigue la posición actual de la bola

---

## ✅ Solución Requerida

### Paso 1: Crear variables de estado para la IA

Agregar antes de la función `update()`:

```typescript
// AI state variables
let aiLastUpdate = 0;           // Timestamp de última actualización
let aiTargetY = 300;            // Posición objetivo calculada
let aiDecision = '';            // 'up', 'down' o ''
```

### Paso 2: Crear función de predicción de trayectoria

```typescript
/**
 * Predice dónde estará la bola cuando llegue al paddle de la IA
 * Considera rebotes en paredes superior e inferior
 */
function predictBallPosition(): number {
  // Solo predecir si la bola va hacia la IA (paddle derecho)
  if (ball.dx < 0) {
    return ball.y; // Si va hacia el otro lado, mantener posición actual
  }

  // Calcular tiempo hasta llegar al paddle de la IA
  const timeToReach = (paddle2.x - ball.x) / ball.dx;
  
  // Calcular posición Y futura
  let futureY = ball.y + (ball.dy * timeToReach);
  
  // Simular rebotes en las paredes
  while (futureY < 10 || futureY > 590) {
    if (futureY < 10) {
      futureY = 20 - futureY; // Rebote en pared superior
    } else if (futureY > 590) {
      futureY = 1180 - futureY; // Rebote en pared inferior
    }
  }
  
  return futureY;
}
```

### Paso 3: Crear función de actualización de IA (cada 1 segundo)

```typescript
/**
 * Actualiza la decisión de la IA
 * Solo se ejecuta una vez por segundo según requisitos
 */
function updateAIDecision(): void {
  const currentTime = Date.now();
  
  // Solo actualizar cada 1000ms (1 segundo)
  if (currentTime - aiLastUpdate < 1000) {
    return; // Mantener decisión anterior
  }
  
  aiLastUpdate = currentTime;
  
  // Predecir dónde estará la bola
  aiTargetY = predictBallPosition();
  
  // Decidir movimiento basado en la predicción
  const paddleCenter = paddle2.y + 50;
  const threshold = 20; // Margen de error para parecer más humano
  
  if (paddleCenter < aiTargetY - threshold) {
    aiDecision = 'down';
  } else if (paddleCenter > aiTargetY + threshold) {
    aiDecision = 'up';
  } else {
    aiDecision = ''; // Centrado, no mover
  }
}
```

### Paso 4: Simular entrada de teclado en la función update()

**REEMPLAZAR** el bloque de IA actual (líneas 218-221) con:

```typescript
if (isAI) {
  // Actualizar decisión de IA (solo cada 1 segundo)
  updateAIDecision();
  
  // Simular presión de teclas según la decisión
  // Esto replica el comportamiento humano
  if (aiDecision === 'up') {
    keys['ArrowUp'] = true;
    keys['ArrowDown'] = false;
  } else if (aiDecision === 'down') {
    keys['ArrowUp'] = false;
    keys['ArrowDown'] = true;
  } else {
    keys['ArrowUp'] = false;
    keys['ArrowDown'] = false;
  }
}
```

### Paso 5: El movimiento del paddle2 ya funciona con teclas

El código existente (líneas 223-225) ya maneja el movimiento con teclas:

```typescript
if (keys['ArrowUp'] && paddle2.y > 0) paddle2.y -= 5;
if (keys['ArrowDown'] && paddle2.y < 500) paddle2.y += 5;
```

**¡No modificar estas líneas!** Ahora funcionarán con la IA también.

---

## 🎯 Mejoras Opcionales (Dificultad)

Para ajustar la dificultad de la IA, puedes modificar:

### Opción 1: Variar el margen de error
```typescript
// En updateAIDecision()
const threshold = difficulty === 2 ? 40 : // Easy: más margen de error
                  difficulty === 3 ? 20 : // Medium
                  5;                       // Hard: muy preciso
```

### Opción 2: Variar frecuencia de actualización
```typescript
// En updateAIDecision()
const updateInterval = difficulty === 2 ? 1500 : // Easy: más lento (1.5s)
                       difficulty === 3 ? 1000 : // Medium: 1 segundo
                       800;                      // Hard: más rápido (0.8s)

if (currentTime - aiLastUpdate < updateInterval) {
  return;
}
```

### Opción 3: Añadir errores aleatorios
```typescript
// En updateAIDecision() - después de predecir
aiTargetY = predictBallPosition();

// Añadir error aleatorio según dificultad
if (difficulty === 2) {
  aiTargetY += (Math.random() - 0.5) * 100; // Easy: mucho error
} else if (difficulty === 3) {
  aiTargetY += (Math.random() - 0.5) * 50;  // Medium: error moderado
}
// Hard: sin error adicional
```

---

## ✅ Checklist de Implementación

- [ ] Agregar variables de estado de IA (`aiLastUpdate`, `aiTargetY`, `aiDecision`)
- [ ] Implementar función `predictBallPosition()` con cálculo de rebotes
- [ ] Implementar función `updateAIDecision()` con restricción de 1 segundo
- [ ] Reemplazar código actual de IA para usar `keys['ArrowUp']` y `keys['ArrowDown']`
- [ ] Probar con diferentes niveles de dificultad
- [ ] Verificar que la IA no actualiza más de 1 vez por segundo (usar `console.log`)
- [ ] Verificar que la IA anticipa rebotes correctamente

---

## 🧪 Testing

### Verificar restricción de 1 segundo:
Agregar temporalmente en `updateAIDecision()`:
```typescript
console.log('AI updated decision at:', currentTime, 'Target Y:', aiTargetY);
```

Deberías ver mensajes solo cada ~1000ms en la consola.

### Verificar predicción de rebotes:
Observar si la IA se posiciona correctamente antes de que la bola rebote.

### Verificar simulación de teclado:
La IA debe moverse de manera similar a un jugador humano (no instantánea).

---

## 📚 Referencia

- **Archivo a modificar:** [`frontend/src/pong.ts`](frontend/src/pong.ts)
- **Líneas problemáticas:** 218-221
- **Función afectada:** `update()`
- **Canvas height:** 600px (paredes en y=10 y y=590)
- **Paddle height:** 100px
- **Velocidad paddle:** 5px por frame

---

## 💡 Notas Importantes

1. **No eliminar el código PvP:** El bloque `else` de PvP debe permanecer intacto
2. **Inicializar variables:** Asegurarse de resetear `aiLastUpdate` cuando inicia el juego
3. **Considerar velocidad variable:** La bola acelera con cada golpe (`* 1.05`), la predicción debe ser robusta
4. **Testing exhaustivo:** Probar todos los niveles de dificultad

---

**¿Preguntas?** Este documento describe EXACTAMENTE qué cambiar y cómo hacerlo para cumplir con los requisitos del módulo Major de IA.
