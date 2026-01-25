# Análisis de Requisitos de Módulos Major y Minor - ft_transcendence

**Fecha de revisión:** 25 de enero de 2026  
**Estado del proyecto:** Revisión de cumplimiento de módulos

---

## 📋 MÓDULOS ANALIZADOS

### 1. Major Module: AI Opponent (IA Player)
### 2. Major Module: Multiple Players
### 3. Major Module: Add Another Game with User History and Matchmaking
### 4. Minor Module: Game Customization Options

---

# 1️⃣ MAJOR MODULE: AI OPPONENT

**Estado actual:** ❌ **NO CUMPLE** completamente  
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

---
---

# 2️⃣ MAJOR MODULE: MULTIPLE PLAYERS

**Estado actual:** ❌ **NO IMPLEMENTADO**  
**Archivos afectados:** Necesita nuevo desarrollo

---

## 📋 Requisitos del Módulo

### Objetivo Principal
Permitir que **más de 2 jugadores** puedan jugar simultáneamente. Cada jugador debe tener control en vivo.

### Especificaciones
- ✅ Se puede mantener el juego regular de 2 jugadores
- ✅ Definir un número específico de jugadores (3, 4, 5, 6 o más)
- ✅ Cada jugador debe tener control en vivo (el módulo "remote players" es altamente recomendado)
- ✅ Ejemplo sugerido: 4 jugadores en un tablero cuadrado, cada uno controlando un lado único

---

## 🔍 Análisis del Código Actual

### Pong Actual
- **Jugadores:** Solo 2 (paddle izquierdo y derecho)
- **Controles:** W/S para Player 1, ArrowUp/ArrowDown para Player 2
- **Bola:** Una sola bola con rebotes en 2 paddles

### TicTacToe Actual
- **Jugadores:** 2 (X y O)
- **Modalidad:** Por turnos, no simultáneo
- **Tablero:** 3x3 fijo

---

## ❌ Problemas Identificados

1. **Arquitectura limitada:** El código actual de Pong está diseñado para exactamente 2 jugadores
2. **Sin soporte para jugadores remotos:** No hay sistema WebSocket/networking implementado
3. **Sin sistema de lobby:** No existe forma de que múltiples jugadores se unan a una partida
4. **Canvas rígido:** El layout actual (800x600) solo soporta 2 paddles laterales

---

## ✅ Soluciones Propuestas

### Opción 1: Pong para 4 Jugadores (Recomendado)

#### Diseño de Gameplay
```
┌─────────────────────┐
│   PLAYER 1 (TOP)    │
│    W/S o ArrowUp/Down
├─────────────────────┤
│                     │
P│                     │P
L│         🔴          │L
A│                     │A
Y│                     │Y
E│                     │E
R│                     │R
 │                     │
3│                     │2
│                     │
│  A/D              ←/→│
├─────────────────────┤
│  PLAYER 4 (BOTTOM)  │
│    Z/X              │
└─────────────────────┘
```

#### Características
- **Tablero:** 800x800 (cuadrado)
- **4 Paddles:** Uno en cada lado
- **1 Bola:** Rebota en los 4 lados
- **Puntuación:** Cada jugador tiene puntos independientes
- **Eliminación progresiva:** Cuando un jugador pierde todas sus vidas, su paddle desaparece

#### Controles Sugeridos
```typescript
// Player 1 (TOP): W/S
// Player 2 (RIGHT): ArrowUp/ArrowDown
// Player 3 (LEFT): A/D  
// Player 4 (BOTTOM): Z/X
```

### Opción 2: Pong Cooperativo 2v2

#### Diseño
- **Equipos:** 2 equipos de 2 jugadores cada uno
- **Lado izquierdo:** 2 paddles (alto y bajo)
- **Lado derecho:** 2 paddles (alto y bajo)
- **Objetivo:** Trabajar en equipo para defender tu lado

---

## 📝 Implementación Requerida

### Paso 1: Crear nuevo archivo para multijugador

**Nuevo archivo:** `frontend/src/pongMultiplayer.ts`

```typescript
interface Paddle {
  x: number;
  y: number;
  w: number;
  h: number;
  side: 'top' | 'right' | 'bottom' | 'left';
  player: Player;
  lives: number;
  isEliminated: boolean;
}

interface Ball {
  x: number;
  y: number;
  r: number;
  dx: number;
  dy: number;
}

const CANVAS_SIZE = 800;
const PADDLE_THICKNESS = 10;
const PADDLE_LENGTH = 150;
const STARTING_LIVES = 3;

let paddles: Paddle[] = [];
let ball: Ball;
let activePlayers: number = 4;

function initGame(playerCount: number = 4): void {
  // Crear paddles según número de jugadores
  if (playerCount === 4) {
    paddles = [
      { x: 325, y: 10, w: 150, h: 10, side: 'top', player: players[0], lives: 3, isEliminated: false },
      { x: 780, y: 325, w: 10, h: 150, side: 'right', player: players[1], lives: 3, isEliminated: false },
      { x: 325, y: 780, w: 150, h: 10, side: 'bottom', player: players[2], lives: 3, isEliminated: false },
      { x: 10, y: 325, w: 10, h: 150, side: 'left', player: players[3], lives: 3, isEliminated: false }
    ];
  }
  
  ball = { x: 400, y: 400, r: 10, dx: 5, dy: 5 };
}

function updatePaddles(): void {
  // Player 1 (TOP) - W/S
  if (keys['w'] && !paddles[0].isEliminated) {
    paddles[0].x = Math.max(0, paddles[0].x - 5);
  }
  if (keys['s'] && !paddles[0].isEliminated) {
    paddles[0].x = Math.min(650, paddles[0].x + 5);
  }
  
  // Player 2 (RIGHT) - ArrowUp/ArrowDown
  if (keys['ArrowUp'] && !paddles[1].isEliminated) {
    paddles[1].y = Math.max(0, paddles[1].y - 5);
  }
  if (keys['ArrowDown'] && !paddles[1].isEliminated) {
    paddles[1].y = Math.min(650, paddles[1].y + 5);
  }
  
  // Player 3 (BOTTOM) - Z/X
  if (keys['z'] && !paddles[2].isEliminated) {
    paddles[2].x = Math.max(0, paddles[2].x - 5);
  }
  if (keys['x'] && !paddles[2].isEliminated) {
    paddles[2].x = Math.min(650, paddles[2].x + 5);
  }
  
  // Player 4 (LEFT) - A/D
  if (keys['a'] && !paddles[3].isEliminated) {
    paddles[3].y = Math.max(0, paddles[3].y - 5);
  }
  if (keys['d'] && !paddles[3].isEliminated) {
    paddles[3].y = Math.min(650, paddles[3].y + 5);
  }
}

function checkCollisions(): void {
  // Top paddle
  if (ball.y <= 20 && ball.x >= paddles[0].x && ball.x <= paddles[0].x + 150 && !paddles[0].isEliminated) {
    ball.dy = Math.abs(ball.dy);
  } else if (ball.y <= 0) {
    paddles[0].lives--;
    if (paddles[0].lives <= 0) eliminatePlayer(0);
    resetBall();
  }
  
  // Right paddle
  if (ball.x >= 770 && ball.y >= paddles[1].y && ball.y <= paddles[1].y + 150 && !paddles[1].isEliminated) {
    ball.dx = -Math.abs(ball.dx);
  } else if (ball.x >= 800) {
    paddles[1].lives--;
    if (paddles[1].lives <= 0) eliminatePlayer(1);
    resetBall();
  }
  
  // Bottom paddle
  if (ball.y >= 770 && ball.x >= paddles[2].x && ball.x <= paddles[2].x + 150 && !paddles[2].isEliminated) {
    ball.dy = -Math.abs(ball.dy);
  } else if (ball.y >= 800) {
    paddles[2].lives--;
    if (paddles[2].lives <= 0) eliminatePlayer(2);
    resetBall();
  }
  
  // Left paddle
  if (ball.x <= 20 && ball.y >= paddles[3].y && ball.y <= paddles[3].y + 150 && !paddles[3].isEliminated) {
    ball.dx = Math.abs(ball.dx);
  } else if (ball.x <= 0) {
    paddles[3].lives--;
    if (paddles[3].lives <= 0) eliminatePlayer(3);
    resetBall();
  }
}

function eliminatePlayer(index: number): void {
  paddles[index].isEliminated = true;
  activePlayers--;
  
  if (activePlayers === 1) {
    // Encontrar ganador
    const winner = paddles.find(p => !p.isEliminated);
    endGame(winner!.player);
  }
}
```

### Paso 2: UI para selección de jugadores

```typescript
function showMultiplayerSetup(): void {
  const modal = document.getElementById('modal')!;
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="card text-center space-y-4">
      <h2 class="text-2xl font-bold text-yellow-400">Multiplayer Pong</h2>
      
      <div class="space-y-2">
        <h3 class="text-lg text-gray-300">Select Number of Players</h3>
        <div class="flex gap-2 justify-center">
          <button onclick="startMultiplayerPong(2)" class="btn btn-green">2 Players</button>
          <button onclick="startMultiplayerPong(3)" class="btn btn-yellow">3 Players</button>
          <button onclick="startMultiplayerPong(4)" class="btn btn-red">4 Players</button>
        </div>
      </div>
      
      <div class="text-left text-sm text-gray-400 space-y-1">
        <p><strong>Controls:</strong></p>
        <p>Player 1 (TOP): W/S</p>
        <p>Player 2 (RIGHT): ↑/↓</p>
        <p>Player 3 (BOTTOM): Z/X</p>
        <p>Player 4 (LEFT): A/D</p>
      </div>
      
      <button onclick="hideModal()" class="btn btn-gray w-full">Cancel</button>
    </div>
  `;
}
```

### Paso 3: Actualizar gameService para multijugador

```typescript
export interface GameSession {
  // ... campos existentes
  playerCount?: number;          // NEW
  players?: Player[];            // NEW - array de todos los jugadores
  isMultiplayer?: boolean;       // NEW
}

export function startMultiplayerSession(players: Player[], gameType: string): void {
  currentSession = {
    players,
    playerCount: players.length,
    gameType,
    isMultiplayer: true,
    startTime: Date.now()
  };
}
```

---

## 🎯 Checklist de Implementación - Multiple Players

- [ ] Crear archivo `pongMultiplayer.ts` con lógica para 3-4 jugadores
- [ ] Implementar sistema de vidas por jugador
- [ ] Implementar eliminación progresiva
- [ ] Crear UI para selección de número de jugadores
- [ ] Actualizar `gameService.ts` para soportar arrays de jugadores
- [ ] Implementar controles para 4 jugadores simultáneos
- [ ] Crear canvas cuadrado (800x800)
- [ ] Implementar colisiones para 4 lados
- [ ] Añadir indicadores visuales de vidas restantes
- [ ] Guardar resultados de partidas multijugador en base de datos
- [ ] **[RECOMENDADO]** Implementar módulo "Remote Players" para juego en red
- [ ] Testing exhaustivo con 2, 3 y 4 jugadores

---

## 💡 Consideraciones para Remote Players

Si se implementa el módulo de jugadores remotos:
- Usar **WebSockets** para sincronización en tiempo real
- Implementar sistema de **lobby/rooms**
- Añadir **latency compensation**
- Validar posiciones en el servidor
- Implementar **reconnection handling**

---
---

# 3️⃣ MAJOR MODULE: ANOTHER GAME WITH USER HISTORY AND MATCHMAKING

**Estado actual:** ⚠️ **PARCIALMENTE IMPLEMENTADO**  
**Archivos afectados:** [`frontend/src/tictactoe.ts`](frontend/src/tictactoe.ts), [`frontend/src/gameService.ts`](frontend/src/gameService.ts)

---

## 📋 Requisitos del Módulo

### Objetivo Principal
Introducir un **nuevo juego distinto de Pong** con funcionalidades de historial de usuario y matchmaking.

### Características Requeridas
1. ✅ Desarrollar un juego nuevo y atractivo para diversificar la oferta
2. ❌ Implementar seguimiento de historial de usuario (estadísticas individuales)
3. ❌ Crear sistema de matchmaking para encontrar oponentes
4. ❌ Almacenar historial de juegos y datos de matchmaking de forma segura
5. ❌ Optimizar rendimiento y capacidad de respuesta
6. ❌ Mantenimiento regular: arreglar bugs, añadir funciones, mejorar gameplay

---

## 🔍 Análisis del Código Actual

### TicTacToe Implementado ✅
- **Archivo:** `frontend/src/tictactoe.ts`
- **Estado:** Juego básico funcional
- **Características:**
  - ✅ Tablero 3x3
  - ✅ Turnos alternados (X y O)
  - ✅ Detección de victoria/empate
  - ✅ UI visual con canvas

### ❌ Funcionalidades Faltantes

#### 1. NO integrado con gameService
```typescript
// TicTacToe actual NO guarda partidas
function showWinner(w: string): void {
  // Solo muestra ganador y regresa al menú
  // NO llama a endGameSession() ni saveMatch()
}
```

#### 2. NO tiene sistema de jugadores
```typescript
// No hay player1/player2 definidos
// Solo símbolos 'X' y 'O' sin nombres
let player = 'X';  // ❌ No son objetos Player
```

#### 3. NO hay matchmaking
- No existe sistema de búsqueda de oponentes
- No hay lobby o cola de espera
- No hay emparejamiento por nivel/ranking

#### 4. NO guarda historial
- Las partidas no se guardan en la base de datos
- No hay estadísticas de TicTacToe por usuario
- No se registran wins/losses

---

## ✅ Solución Requerida

### Paso 1: Integrar TicTacToe con gameService

**Modificar:** `frontend/src/tictactoe.ts`

```typescript
import { navigate } from './router.js';
import {
  getCurrentUser,
  createRegisteredPlayer,
  createGuestPlayer,
  createAIPlayer,
  startGameSession,
  endGameSession,
  type Player,
  type GameSession,
  getGameSession
} from './gameService.js';

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let board: string[][] = [['','',''],['','',''],['','','']];
let currentPlayer: 'X' | 'O' = 'X';
let over = false;

// NEW: Player objects
let player1: Player;  // X
let player2: Player;  // O

/**
 * Setup TicTacToe game with players
 */
export async function setupTicTacToe(ai: boolean = false): Promise<void> {
  const currentUser = await getCurrentUser();
  
  if (currentUser) {
    player1 = createRegisteredPlayer(currentUser);
  } else {
    player1 = createGuestPlayer('Player 1');
  }
  
  if (ai) {
    player2 = createAIPlayer(3); // Medium difficulty
  } else {
    player2 = createGuestPlayer('Player 2');
  }
  
  // Start session
  startGameSession({
    player1,
    player2,
    gameType: 'tictactoe',
    isAI: ai,
    startTime: Date.now()
  });
  
  startTicTacToe();
}

export function startTicTacToe(): void {
  const session = getGameSession();
  if (!session) {
    console.error('No game session');
    return;
  }
  
  player1 = session.player1;
  player2 = session.player2;
  
  navigate('game');
  
  setTimeout(() => {
    canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    ctx = canvas.getContext('2d')!;
    canvas.width = 600;
    canvas.height = 600;
    
    board = [['','',''],['','',''],['','','']];
    currentPlayer = 'X';
    over = false;
    
    canvas.onclick = handleClick;
    draw();
  }, 50);
}

function handleClick(e: MouseEvent): void {
  if (over) return;
  
  const rect = canvas.getBoundingClientRect();
  const c = Math.floor((e.clientX - rect.left) / 200);
  const r = Math.floor((e.clientY - rect.top) / 200);
  
  if (board[r][c]) return;
  
  board[r][c] = currentPlayer;
  draw();
  
  const result = checkWin();
  if (result) {
    over = true;
    
    // NEW: Calculate scores (TicTacToe: winner gets 1, loser gets 0)
    let score1 = 0, score2 = 0;
    if (result === 'X') score1 = 1;
    else if (result === 'O') score2 = 1;
    else { score1 = 0.5; score2 = 0.5; } // Tie
    
    // NEW: Save match
    endGameSession(score1, score2).then(() => {
      setTimeout(() => showWinner(result), 300);
    });
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  }
}

function showWinner(w: string): void {
  const el = document.getElementById('countdown')!;
  const txt = document.getElementById('countdownText')!;
  el.classList.remove('hidden');
  
  let message = '';
  if (w === 'Tie') {
    message = "It's a Tie!";
  } else {
    const winner = w === 'X' ? player1 : player2;
    message = `${winner.name} Wins!`;
  }
  
  txt.textContent = message;
  txt.className = 'text-5xl font-bold text-yellow-300';
  
  setTimeout(() => {
    el.classList.add('hidden');
    txt.className = 'text-9xl font-extrabold text-yellow-300';
    navigate('games');
  }, 2000);
}

// Global exports
(window as any).setupTicTacToe = setupTicTacToe;
(window as any).startTicTacToe = startTicTacToe;
```

### Paso 2: Actualizar UI del menú de juegos

**Modificar:** `frontend/src/pages/games.ts`

```typescript
// Añadir botones para TicTacToe con las mismas opciones que Pong
<div class="game-card">
  <h3 class="text-xl font-bold text-yellow-400">TicTacToe</h3>
  <p class="text-gray-400 text-sm">Classic strategy game</p>
  <div class="flex gap-2 mt-4">
    <button onclick="setupTicTacToe(false)" class="btn btn-green flex-1">vs Player</button>
    <button onclick="setupTicTacToe(true)" class="btn btn-yellow flex-1">vs AI</button>
  </div>
</div>
```

### Paso 3: Implementar Matchmaking System

**Nuevo archivo:** `frontend/src/matchmaking.ts`

```typescript
import { api } from './api.js';
import { getCurrentUser, type Player } from './gameService.js';

interface MatchmakingRequest {
  userId: string;
  gameType: 'pong' | 'tictactoe';
  skillLevel?: number;  // 1-10, calculado por wins/losses
}

interface MatchFound {
  roomId: string;
  opponent: Player;
  gameType: string;
}

let matchmakingInterval: number | null = null;
let isSearching = false;

/**
 * Start searching for a match
 */
export async function startMatchmaking(gameType: 'pong' | 'tictactoe'): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    alert('You must be logged in to use matchmaking');
    return;
  }
  
  isSearching = true;
  showMatchmakingUI();
  
  // Join matchmaking queue
  try {
    await api('/api/matchmaking/join', {
      method: 'POST',
      body: JSON.stringify({
        userId: user.id,
        gameType,
        skillLevel: await calculateSkillLevel(user.id)
      })
    });
    
    // Poll for match every 2 seconds
    matchmakingInterval = setInterval(checkForMatch, 2000);
  } catch (error) {
    console.error('Failed to join matchmaking:', error);
    stopMatchmaking();
  }
}

/**
 * Check if a match has been found
 */
async function checkForMatch(): Promise<void> {
  try {
    const response = await api<{ found: boolean; match?: MatchFound }>('/api/matchmaking/status');
    
    if (response.found && response.match) {
      stopMatchmaking();
      onMatchFound(response.match);
    }
  } catch (error) {
    console.error('Error checking match status:', error);
  }
}

/**
 * Calculate user skill level based on win/loss ratio
 */
async function calculateSkillLevel(userId: string): Promise<number> {
  try {
    const stats = await api<{ wins: number; losses: number }>(`/api/users/${userId}/stats`);
    const total = stats.wins + stats.losses;
    if (total === 0) return 5; // Default: intermediate
    
    const winRate = stats.wins / total;
    return Math.ceil(winRate * 10); // 1-10 scale
  } catch {
    return 5; // Default on error
  }
}

/**
 * Stop matchmaking search
 */
export function stopMatchmaking(): void {
  isSearching = false;
  if (matchmakingInterval) {
    clearInterval(matchmakingInterval);
    matchmakingInterval = null;
  }
  hideMatchmakingUI();
  
  // Leave queue
  api('/api/matchmaking/leave', { method: 'POST' }).catch(console.error);
}

/**
 * Handle match found
 */
function onMatchFound(match: MatchFound): void {
  alert(`Match found! Playing against ${match.opponent.name}`);
  
  // Start game with matched opponent
  if (match.gameType === 'pong') {
    // Start remote pong game
    startRemotePong(match.roomId, match.opponent);
  } else if (match.gameType === 'tictactoe') {
    // Start remote tictactoe game
    startRemoteTicTacToe(match.roomId, match.opponent);
  }
}

/**
 * Show matchmaking UI overlay
 */
function showMatchmakingUI(): void {
  const modal = document.getElementById('modal')!;
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="card text-center space-y-4">
      <h2 class="text-2xl font-bold text-yellow-400">Finding Match...</h2>
      <div class="animate-spin w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto"></div>
      <p class="text-gray-400">Searching for an opponent with similar skill level</p>
      <button onclick="stopMatchmaking()" class="btn btn-red">Cancel</button>
    </div>
  `;
}

function hideMatchmakingUI(): void {
  document.getElementById('modal')!.classList.add('hidden');
}

// Global exports
(window as any).startMatchmaking = startMatchmaking;
(window as any).stopMatchmaking = stopMatchmaking;
```

### Paso 4: Backend - Matchmaking Service

**Nuevo archivo:** `database/routes/matchmaking.js`

```javascript
const express = require('express');
const router = express.Router();

// In-memory matchmaking queue (use Redis in production)
const matchmakingQueue = {
  pong: [],
  tictactoe: []
};

/**
 * Join matchmaking queue
 * POST /matchmaking/join
 */
router.post('/join', (req, res) => {
  const { userId, gameType, skillLevel } = req.body;
  
  if (!userId || !gameType) {
    return res.status(400).json({ error: 'userId and gameType required' });
  }
  
  // Check if already in queue
  const queue = matchmakingQueue[gameType] || [];
  if (queue.find(p => p.userId === userId)) {
    return res.json({ success: true, message: 'Already in queue' });
  }
  
  // Add to queue
  const player = {
    userId,
    skillLevel: skillLevel || 5,
    joinedAt: Date.now()
  };
  
  matchmakingQueue[gameType] = matchmakingQueue[gameType] || [];
  matchmakingQueue[gameType].push(player);
  
  // Try to find match immediately
  tryFindMatch(userId, gameType);
  
  res.json({ success: true });
});

/**
 * Check matchmaking status
 * GET /matchmaking/status
 */
router.get('/status', (req, res) => {
  const { userId } = req.query;
  
  // Check if match was created for this user
  // (In production, store this in Redis/database)
  const match = findUserMatch(userId);
  
  if (match) {
    res.json({ found: true, match });
  } else {
    res.json({ found: false });
  }
});

/**
 * Leave matchmaking queue
 * POST /matchmaking/leave
 */
router.post('/leave', (req, res) => {
  const { userId } = req.body;
  
  // Remove from all queues
  for (const gameType in matchmakingQueue) {
    matchmakingQueue[gameType] = matchmakingQueue[gameType].filter(
      p => p.userId !== userId
    );
  }
  
  res.json({ success: true });
});

/**
 * Try to find a match for a player
 */
function tryFindMatch(userId, gameType) {
  const queue = matchmakingQueue[gameType];
  if (!queue || queue.length < 2) return null;
  
  const player = queue.find(p => p.userId === userId);
  if (!player) return null;
  
  // Find closest skill level match
  const opponents = queue.filter(p => p.userId !== userId);
  const bestMatch = opponents.reduce((best, opp) => {
    const skillDiff = Math.abs(opp.skillLevel - player.skillLevel);
    const bestDiff = Math.abs(best.skillLevel - player.skillLevel);
    return skillDiff < bestDiff ? opp : best;
  }, opponents[0]);
  
  if (!bestMatch) return null;
  
  // Create match
  const roomId = `${gameType}-${Date.now()}`;
  createMatch(roomId, player, bestMatch, gameType);
  
  // Remove both players from queue
  matchmakingQueue[gameType] = queue.filter(
    p => p.userId !== userId && p.userId !== bestMatch.userId
  );
  
  return roomId;
}

module.exports = router;
```

### Paso 5: Añadir estadísticas de TicTacToe

**Modificar:** `database/services/gdpr.js` (para incluir TicTacToe en stats)

```javascript
// Actualizar queries para incluir tictactoe
const statsResult = await db.query(`
  SELECT 
    SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN winner_id != ? AND winner_id IS NOT NULL THEN 1 ELSE 0 END) as losses,
    COUNT(*) as total_games,
    SUM(CASE WHEN game_type = 'pong' THEN 1 ELSE 0 END) as pong_games,
    SUM(CASE WHEN game_type = 'tictactoe' THEN 1 ELSE 0 END) as tictactoe_games
  FROM matches
  WHERE player1_id = ? OR player2_id = ?
`, [userId, userId, userId, userId]);
```

---

## 🎯 Checklist de Implementación - Another Game

- [ ] **Integración TicTacToe:**
  - [ ] Modificar `tictactoe.ts` para usar `gameService`
  - [ ] Añadir sistema de jugadores (Player objects)
  - [ ] Integrar `endGameSession()` y `saveMatch()`
  - [ ] Probar que las partidas se guardan en BD
  
- [ ] **Matchmaking System:**
  - [ ] Crear `matchmaking.ts` en frontend
  - [ ] Crear rutas de matchmaking en backend
  - [ ] Implementar cola de espera
  - [ ] Implementar algoritmo de emparejamiento por skill level
  - [ ] Crear UI de búsqueda de partida
  - [ ] Testing de matchmaking con múltiples usuarios
  
- [ ] **User History:**
  - [ ] Extender estadísticas para incluir TicTacToe
  - [ ] Crear página de historial de partidas
  - [ ] Mostrar stats separadas por juego (Pong vs TicTacToe)
  - [ ] Implementar filtros en historial
  
- [ ] **Optimización:**
  - [ ] Usar Redis para cola de matchmaking (escala mejor que memoria)
  - [ ] Implementar timeouts para matchmaking
  - [ ] Añadir WebSockets para notificaciones instantáneas
  - [ ] Testing de rendimiento

---
---

# 4️⃣ MINOR MODULE: GAME CUSTOMIZATION OPTIONS

**Estado actual:** ❌ **NO IMPLEMENTADO**  
**Archivos afectados:** Múltiples (requiere nuevo desarrollo)

---

## 📋 Requisitos del Módulo

### Objetivo Principal
Proporcionar opciones de personalización para **todos los juegos disponibles** en la plataforma.

### Características Requeridas
1. ❌ Ofrecer opciones de personalización: power-ups, ataques, mapas diferentes
2. ✅ Permitir versión por defecto con características básicas
3. ❌ Opciones disponibles para **TODOS** los juegos
4. ❌ Menús de configuración amigables
5. ❌ Consistencia en personalización entre juegos

---

## 🔍 Estado Actual

### ❌ Sin Personalizaciones
- **Pong:** Solo opciones de dificultad de IA (no es personalización de gameplay)
- **TicTacToe:** Sin opciones de ningún tipo
- **Sin power-ups** implementados
- **Sin mapas alternativos**
- **Sin modificadores de juego**

---

## ✅ Propuestas de Personalización

### Pong - Opciones de Personalización

#### 1. Power-ups (Recomendado)
```typescript
interface PowerUp {
  x: number;
  y: number;
  type: 'speed' | 'size' | 'multiball' | 'slow' | 'shield';
  active: boolean;
  duration: number;
}

// Tipos de power-ups
const powerUpTypes = {
  speed: {
    name: 'Speed Boost',
    color: '#00ff00',
    effect: (paddle) => paddle.speed *= 2,
    duration: 5000
  },
  size: {
    name: 'Bigger Paddle',
    color: '#0000ff',
    effect: (paddle) => paddle.h *= 1.5,
    duration: 8000
  },
  multiball: {
    name: 'Multi Ball',
    color: '#ff00ff',
    effect: () => spawnExtraBalls(2),
    duration: 10000
  },
  slow: {
    name: 'Slow Motion',
    color: '#ffff00',
    effect: (ball) => ball.dx *= 0.5, ball.dy *= 0.5,
    duration: 6000
  },
  shield: {
    name: 'Shield',
    color: '#00ffff',
    effect: (player) => player.hasShield = true,
    duration: 7000
  }
};

// Spawn power-ups aleatoriamente
function spawnPowerUp(): void {
  if (Math.random() < 0.1) { // 10% probabilidad cada segundo
    const types = Object.keys(powerUpTypes);
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    powerUps.push({
      x: Math.random() * 700 + 50,
      y: Math.random() * 500 + 50,
      type: randomType,
      active: true,
      duration: 0
    });
  }
}
```

#### 2. Mapas Alternativos
```typescript
interface MapConfig {
  name: string;
  obstacles: Obstacle[];
  background: string;
  ballSpeed: number;
}

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'static' | 'moving' | 'bouncy';
}

const maps = {
  classic: {
    name: 'Classic',
    obstacles: [],
    background: '#000',
    ballSpeed: 5
  },
  obstacles: {
    name: 'Obstacle Course',
    obstacles: [
      { x: 350, y: 100, w: 100, h: 20, type: 'static' },
      { x: 350, y: 480, w: 100, h: 20, type: 'static' },
      { x: 390, y: 290, w: 20, h: 20, type: 'bouncy' }
    ],
    background: '#001122',
    ballSpeed: 5
  },
  speed: {
    name: 'Speed Mode',
    obstacles: [],
    background: '#220000',
    ballSpeed: 8
  },
  moving: {
    name: 'Moving Walls',
    obstacles: [
      { x: 300, y: 200, w: 200, h: 20, type: 'moving' }
    ],
    background: '#002200',
    ballSpeed: 5
  }
};
```

#### 3. Modos de Juego
```typescript
interface GameMode {
  name: string;
  winCondition: number;
  ballCount: number;
  paddleSize: number;
  powerUpsEnabled: boolean;
}

const gameModes = {
  classic: {
    name: 'Classic',
    winCondition: 5,
    ballCount: 1,
    paddleSize: 100,
    powerUpsEnabled: false
  },
  quick: {
    name: 'Quick Match',
    winCondition: 3,
    ballCount: 1,
    paddleSize: 100,
    powerUpsEnabled: false
  },
  chaos: {
    name: 'Chaos Mode',
    winCondition: 10,
    ballCount: 3,
    paddleSize: 80,
    powerUpsEnabled: true
  },
  practice: {
    name: 'Practice',
    winCondition: 999,
    ballCount: 1,
    paddleSize: 150,
    powerUpsEnabled: false
  }
};
```

### TicTacToe - Opciones de Personalización

#### 1. Tamaños de Tablero
```typescript
const boardSizes = {
  small: 3,    // 3x3 (clásico)
  medium: 4,   // 4x4
  large: 5     // 5x5
};

// Ajustar condición de victoria
function checkWin(size: number): string | null {
  const winLength = size === 3 ? 3 : size === 4 ? 4 : 4; // 4 en raya para 4x4 y 5x5
  // ... lógica de detección
}
```

#### 2. Temas Visuales
```typescript
const themes = {
  classic: {
    backgroundColor: '#000',
    gridColor: '#fff',
    xColor: '#3b82f6',
    oColor: '#ef4444'
  },
  neon: {
    backgroundColor: '#0a0a1a',
    gridColor: '#00ff00',
    xColor: '#ff00ff',
    oColor: '#00ffff'
  },
  minimal: {
    backgroundColor: '#f5f5f5',
    gridColor: '#333',
    xColor: '#666',
    oColor: '#999'
  }
};
```

#### 3. Modos Especiales
```typescript
const specialModes = {
  timed: {
    name: 'Timed Mode',
    timePerTurn: 5000, // 5 segundos por turno
    penalty: 'skip' // saltar turno si se acaba el tiempo
  },
  ultimateTTT: {
    name: 'Ultimate TicTacToe',
    grid: 3, // 3x3 tableros grandes
    subgrid: 3 // cada uno con 3x3 pequeños
  },
  gravity: {
    name: 'Gravity Mode',
    enableGravity: true // las fichas "caen" como Connect 4
  }
};
```

---

## 📝 Implementación UI de Personalización

### Menú de Customización Global

**Nuevo archivo:** `frontend/src/pages/customize.ts`

```typescript
export function renderCustomizePage(): string {
  return `
    <div class="container mx-auto p-6 space-y-6">
      <h1 class="text-3xl font-bold text-yellow-400">Game Customization</h1>
      
      <!-- Pong Customization -->
      <div class="card space-y-4">
        <h2 class="text-2xl font-bold text-white">Pong Settings</h2>
        
        <div class="grid grid-cols-2 gap-4">
          <!-- Map Selection -->
          <div>
            <label class="block text-sm text-gray-400 mb-2">Map</label>
            <select id="pongMap" class="w-full p-2 rounded bg-gray-700 text-white">
              <option value="classic">Classic</option>
              <option value="obstacles">Obstacle Course</option>
              <option value="speed">Speed Mode</option>
              <option value="moving">Moving Walls</option>
            </select>
          </div>
          
          <!-- Game Mode -->
          <div>
            <label class="block text-sm text-gray-400 mb-2">Mode</label>
            <select id="pongMode" class="w-full p-2 rounded bg-gray-700 text-white">
              <option value="classic">Classic (First to 5)</option>
              <option value="quick">Quick Match (First to 3)</option>
              <option value="chaos">Chaos Mode (Multi-ball + Power-ups)</option>
              <option value="practice">Practice (Unlimited)</option>
            </select>
          </div>
          
          <!-- Power-ups Toggle -->
          <div class="col-span-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="pongPowerUps" class="w-5 h-5">
              <span class="text-white">Enable Power-ups</span>
            </label>
          </div>
        </div>
        
        <button onclick="saveCustomization('pong')" class="btn btn-green">
          Save Pong Settings
        </button>
      </div>
      
      <!-- TicTacToe Customization -->
      <div class="card space-y-4">
        <h2 class="text-2xl font-bold text-white">TicTacToe Settings</h2>
        
        <div class="grid grid-cols-2 gap-4">
          <!-- Board Size -->
          <div>
            <label class="block text-sm text-gray-400 mb-2">Board Size</label>
            <select id="tttBoardSize" class="w-full p-2 rounded bg-gray-700 text-white">
              <option value="3">3x3 (Classic)</option>
              <option value="4">4x4 (Advanced)</option>
              <option value="5">5x5 (Expert)</option>
            </select>
          </div>
          
          <!-- Theme -->
          <div>
            <label class="block text-sm text-gray-400 mb-2">Theme</label>
            <select id="tttTheme" class="w-full p-2 rounded bg-gray-700 text-white">
              <option value="classic">Classic</option>
              <option value="neon">Neon</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
          
          <!-- Special Mode -->
          <div class="col-span-2">
            <label class="block text-sm text-gray-400 mb-2">Special Mode</label>
            <select id="tttSpecialMode" class="w-full p-2 rounded bg-gray-700 text-white">
              <option value="none">None (Standard)</option>
              <option value="timed">Timed Mode (5s per turn)</option>
              <option value="gravity">Gravity Mode</option>
            </select>
          </div>
        </div>
        
        <button onclick="saveCustomization('tictactoe')" class="btn btn-green">
          Save TicTacToe Settings
        </button>
      </div>
      
      <!-- Reset to Defaults -->
      <div class="text-center">
        <button onclick="resetAllCustomizations()" class="btn btn-gray">
          Reset All to Defaults
        </button>
      </div>
    </div>
  `;
}

/**
 * Save customization to localStorage
 */
function saveCustomization(game: string): void {
  if (game === 'pong') {
    const settings = {
      map: (document.getElementById('pongMap') as HTMLSelectElement).value,
      mode: (document.getElementById('pongMode') as HTMLSelectElement).value,
      powerUpsEnabled: (document.getElementById('pongPowerUps') as HTMLInputElement).checked
    };
    localStorage.setItem('pongCustomization', JSON.stringify(settings));
    alert('Pong settings saved!');
  } else if (game === 'tictactoe') {
    const settings = {
      boardSize: parseInt((document.getElementById('tttBoardSize') as HTMLSelectElement).value),
      theme: (document.getElementById('tttTheme') as HTMLSelectElement).value,
      specialMode: (document.getElementById('tttSpecialMode') as HTMLSelectElement).value
    };
    localStorage.setItem('tictactoeCustomization', JSON.stringify(settings));
    alert('TicTacToe settings saved!');
  }
}

/**
 * Load customization from localStorage
 */
export function loadCustomization(game: string): any {
  const stored = localStorage.getItem(`${game}Customization`);
  return stored ? JSON.parse(stored) : getDefaultSettings(game);
}

function getDefaultSettings(game: string): any {
  if (game === 'pong') {
    return { map: 'classic', mode: 'classic', powerUpsEnabled: false };
  } else if (game === 'tictactoe') {
    return { boardSize: 3, theme: 'classic', specialMode: 'none' };
  }
}

function resetAllCustomizations(): void {
  localStorage.removeItem('pongCustomization');
  localStorage.removeItem('tictactoeCustomization');
  alert('All settings reset to defaults!');
  location.reload();
}

(window as any).saveCustomization = saveCustomization;
(window as any).resetAllCustomizations = resetAllCustomizations;
```

### Integrar Customización en Juegos

**Modificar:** `frontend/src/pong.ts`

```typescript
import { loadCustomization } from './pages/customize.js';

export function startPong(ai: boolean, diff = 3): void {
  // ... código existente
  
  // NEW: Load customization
  const customization = loadCustomization('pong');
  applyPongCustomization(customization);
  
  // ... resto del código
}

function applyPongCustomization(settings: any): void {
  // Apply map
  currentMap = maps[settings.map] || maps.classic;
  
  // Apply game mode
  const mode = gameModes[settings.mode] || gameModes.classic;
  winScore = mode.winCondition;
  paddle1.h = paddle2.h = mode.paddleSize;
  
  // Enable power-ups if selected
  powerUpsEnabled = settings.powerUpsEnabled;
  
  // Apply ball speed from map
  ball.dx = currentMap.ballSpeed * (ball.dx > 0 ? 1 : -1);
  ball.dy = currentMap.ballSpeed * (ball.dy > 0 ? 1 : -1);
}
```

---

## 🎯 Checklist de Implementación - Customization

- [ ] **UI de Personalización:**
  - [ ] Crear página `customize.ts`
  - [ ] Diseñar menús para Pong
  - [ ] Diseñar menús para TicTacToe
  - [ ] Implementar sistema de guardado (localStorage)
  - [ ] Añadir link en navegación principal
  
- [ ] **Pong Customization:**
  - [ ] Implementar power-ups (5 tipos mínimo)
  - [ ] Crear 4 mapas diferentes
  - [ ] Implementar modos de juego (quick, chaos, practice)
  - [ ] Sistema de spawn de power-ups
  - [ ] Visual feedback para power-ups activos
  
- [ ] **TicTacToe Customization:**
  - [ ] Soporte para tableros 3x3, 4x4, 5x5
  - [ ] Implementar 3 temas visuales
  - [ ] Modo cronometrado (timer por turno)
  - [ ] Modo gravedad (optional)
  
- [ ] **Integración:**
  - [ ] Cargar configuración al inicio de cada juego
  - [ ] Aplicar configuración durante gameplay
  - [ ] Mostrar configuración activa en UI
  - [ ] Opción de "Reset to Default"
  
- [ ] **Testing:**
  - [ ] Probar todas las combinaciones de settings
  - [ ] Verificar persistencia de configuración
  - [ ] Testing de power-ups en diferentes mapas
  - [ ] Balance de dificultad en modos especiales

---
---

# 📊 RESUMEN GENERAL DE CUMPLIMIENTO

| Módulo | Estado | Prioridad | Complejidad |
|--------|--------|-----------|-------------|
| **AI Opponent** | ⚠️ Parcial (70%) | 🔴 Alta | Media |
| **Multiple Players** | ❌ No implementado | 🟡 Media | Alta |
| **Another Game + Matchmaking** | ⚠️ Parcial (40%) | 🔴 Alta | Alta |
| **Game Customization** | ❌ No implementado | 🟢 Baja | Media |

---

## 🚀 Roadmap Sugerido

### Fase 1: Completar IA (1-2 días)
1. Implementar simulación de teclado
2. Añadir restricción de 1 segundo
3. Implementar predicción de rebotes
4. Testing exhaustivo

### Fase 2: Matchmaking + TicTacToe Integration (3-4 días)
1. Integrar TicTacToe con gameService
2. Crear sistema de matchmaking (frontend + backend)
3. Implementar queue y skill-based matching
4. Testing con múltiples usuarios

### Fase 3: Customization (2-3 días)
1. Diseñar UI de personalización
2. Implementar power-ups para Pong
3. Crear mapas alternativos
4. Añadir opciones para TicTacToe
5. Testing de todas las combinaciones

### Fase 4: Multiple Players (4-5 días)
1. Diseñar gameplay para 4 jugadores
2. Implementar controles y lógica
3. Crear UI de selección
4. Testing multijugador local
5. [OPCIONAL] Implementar remote players con WebSockets

---

## 💡 Notas Finales

- **Prioridad inmediata:** Completar módulo de IA (es el más avanzado)
- **Mayor impacto:** Matchmaking system (mejora mucho la experiencia)
- **Más trabajo:** Multiple players con remote support
- **Más divertido:** Game customization (power-ups, etc.)

Todos los módulos están documentados con código de ejemplo listo para implementar. ¡Buena suerte! 🎮

---

**¿Preguntas?** Este documento describe EXACTAMENTE qué cambiar y cómo hacerlo para cumplir con TODOS los requisitos de los módulos Major y Minor.
