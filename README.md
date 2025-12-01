
> IMPORTANTE:
- La web se levanta en https://localhost:8443 por cuestiones del campus
- En el navegador, al usar certificados autofirmado debes aceptar los riesgos
- En el campus hay restricciones de permisos, uso de puertos, acceso a logs
- La web se puede poner en Ingles/Español por si no concuerda con algo de esta guia

### Últimos cambios

- Carpeta ssl a Nginx
- Puertos expuestos (NGINX, grafana & vault). A todos los microservicios se accede usando Nginx como proxy + https, pero en el caso de esas app, no pueden acceder ya que no soportan subpath localhost:8443/grafana ... asi que se opta por redirigir a su propio puerto expuesto.
- Dockerfile por cada servicio / carpeta
- Un solo docker-compose refactorizado. Cada contenedor tiene su healthcheck
- Añadido .gitignore
- Añadido web de administracion temporal (borrar) https://localhost:8443/admin/users.html

## MAKE

| Comando  | Descripción breve                                                              |
|-----------|----------------------------------------------------------------------------------|
| `all`     | Construye y levanta los contenedores (alias de `build up`)                      |
| `build`   | Construye las imágenes de Docker                                                |
| `up`      | Levanta los contenedores en segundo plano y muestra la URL de acceso           |
| `down`    | Detiene y elimina los contenedores                                              |
| `re`      | Reinicia los servicios (down, build, up)                                        |
| `clean`   | Elimina contenedores, volúmenes e imágenes locales                              |
| `fclean`  | Elimina contenedores y volúmenes                                                |
| `logs`    | Muestra los logs de los contenedores                                            |
| `ps`      | Lista los contenedores con formato de tabla                                    |
| `destroy` | Elimina **todos** los contenedores, imágenes, volúmenes y redes del sistema    |

## IMAGES

![alt text](_assets/images.png)

## CONTENEDORES

| Servicio   | Puertos expuesto    | Propósito                          |
|------------|---------------------|------------------------------------|
| nginx-waf  | 8443                | Proxy reverso con WAF y SSL        |
| vault      | 8444                | Almacenamiento seguro de secretos  |
| grafana    | 8445                | Dashboard de monitoreo y métricas  |
| prometheus |                     | Recolección de métricas y logs     |
| redis      |                     | Base de datos en memoria           |
| web-app    |                     | Aplicación principal               |

![alt text](_assets/images.png)

## Cómo añadir autenticación a otros módulos??

Todo va por token (JWT) o cookie de sesión. Una vez autenticado:
    Cookie (auto-enviada) si el microservicio está en el mismo dominio
    Token (manual) si es API/microservicios a "Otro contenedor"
- Frontend envía token en cabecera Authorization: Bearer <token>
- Backend servicios verifican token con:
	- Microservicios: Envían token a servicio de auth para validar (API call)
	- Monolito/Shared DB: Verifican token directamente (firma JWT)
	- API Gateway: Valida token y propaga headers (ej: X-User-Id)

Login → Auth genera token → Cliente lo guarda (cookie/localStorage)
→ En cada request a otros módulos: envía token → Backend verifica → Acceso autorizado

### La clave son los middleware
- Verifican token/cookie automáticamente en cada request
- Extraen info del usuario (ID, roles, permisos)
- Deciden si la petición pasa o se rechaza
- Propagan contexto (req.user) a todos los módulos

Ejemplo de uso de los middleware de autenticación y checkeo de admin por ruta:
``` javascript
fastify.get('/users', {
	preHandler: [authenticateJWT, requireAdmin]
}, async (request, reply) => {
	return reply.sendFile('admin/users.html');
});

```

## Oauth con Github (Montar el "server" de autenticación)

- Antes de nada hay que darle permisos en Authorized OAuth para registrar la App en:
https://github.com/settings/applications . Esto se hace una vez.
![alt text](_assets/github1.png)

- Configuración
![alt text](_assets/github3.png)

- Los datos que hay que incluir en el .env
![alt text](_assets/gitubenv.png)

- Confirmo la autorización
![alt text](_assets/gihutauth.png)

- Hacer uso del boton oauth
![alt text](_assets/oatuh.png)

- Usuario autenticado con Oauth. El protocólo solo extrae datos básicos, de los usuarios.
![alt text](_assets/okauthgit.png)

## Login con registro

- Primero resgistrar (Password requiere mayusculas, minusculas, números, especiales)
![alt text](_assets/register.png)

- Perfil con avatar por defecto
![alt text](_assets/loginprof.png)

## Activar 2fa

Aún no he consegido que sincronice bien con app de android.
La clave del 2fa es el SECRET. Ejemplo: OBHG2SKNGBGHO4TBHZHW6KDBMMXEWM32GZKGGM3IJJSF4QJVJJNA

Es lo que hay que guardar con cuidado, ya que a partir de ese chorizo se generan los códigos de autenticación. En condiciones normales no se muestra por ningún lado... son las app de autenticación (google aut...etc) las encargadas de guardalas mediante el escaneo del código QR. Pero como no van, pongo algunas alternativas para generar códigos.

1 - Hay un botón en el perfil que dirige a https://localhost:8443/admin/decode.html, ahí metes el SECRET que aparece al habilitarlo

2 - https://qrcoderaptor.com/es/

3 - sudo apt install oathtool

`oathtool --totp -b OBHG2SKNGBGHO4TBHZHW6KDBMMXEWM32GZKGGM3IJJSF4QJVJJNA`

- Habilitar 2fa: Dar al botón Gestionar 2FA del perfil
![alt text](_assets/enable2fa.png)

- Copias el secreto de la ventana que sale al pulsar el botón Configurar 2FA. Generas el código y lo pegas (Ver abajo)
![alt text](_assets/tot.png)

- Te vas a tu generador de códigos favorito (Ojo, estos códigos caducan en segundos)
![alt text](_assets/gentot.png)

- Una vez habilitado te salen los códigos de recuperación. Que se usan en caso de que al hacer lógin y tener el 2FA activado no tengas tu SECRET porque lo perdiste, borraste la app de autentificación que lo guardaba, etc... Estos códigos se van borrando al usarlos
![alt text](_assets/backcodes.png)

- 2FA ya Habilitado
![alt text](_assets/okenablef2a.png)

- Ahora despúes de hacer logín con tu email/password también se te pide que generes un código TOTP para acceder
![alt text](_assets/acces2fa.png)

- Para deshabilitarlo, los pasos son los mismos: Le das al botón de deshabilitar, te pedirá un código TOTP, lo metes y se deshabilita.


### Grafana (En construcción)

https://localhost:8445/login User/Password:admin/admin -> Skip

https://localhost:8445/dashboards
![alt text](_assets/grafa1.png)
![alt text](_assets/grafa2.png)

en https://localhost:8445/a/grafana-metricsdrilldown-app/drilldown vienen muchas más métricas por defecto
![alt text](_assets/grafa3.png)

### Archivos de interes

> El servidor node.js se inicia aquí
/backend/index.js

> Creación de tablas y campos de la base de datos
/backend/config/sqlite.js

> Archivo de idiomas
/backend/locales


### URLs de estado de servicios expuestos (todos usan HTTPS)
No se puede incluir como subpath (8443)/grafana porque no lo permiten (O sí?)

> APP
https://localhost:8443/health

> VAULT
https://localhost:8444/v1/sys/health

> GRAFANA
https://localhost:8445/api/health


# TODO
- [ ] Mostrar mejor los fallos en popup y en su idioma correcto
- [X] Terminar GDPR + cookie ?
- [ ] Pasar a TS
- [ ] Crear tests para checkear la seguridad (siege, simuladores de ataque, script, ...)
- [ ] Mejorar grafana
- [ ] 2fa con apps
- [ ] Mejor uso de vault
- [ ] TODO - Parece no sincronizarse con app android
- [ ]

## Sugerencias
- [ ] + Frances
- [ ] Mirar Oauth con telegram y 42
