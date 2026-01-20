# LO NUEVO

 ✔ Container users       Running                                                                                                                                                                              0.0s 
 ✔ Container vault       Healthy                                                                                                                                                                              0.5s 
 ✔ Container i18n        Healthy                                                                                                                                                                              1.0s 
 ✔ Container database    Healthy                                                                                                                                                                              1.0s 
 ✔ Container prometheus  Healthy                                                                                                                                                                              0.5s 
 ✔ Container auth        Healthy                                                                                                                                                                              1.0s 
 ✔ Container grafana     Running                                                                                                                                                                              0.0s 
 ✔ Container gateway     Running                                                                                                                                                                              0.0s 
 ✔ Container nginx       Running  



docker stop auth
docker rm auth
docker rmi auth
docker volume prune -f
docker compose up -d auth
docker ps -a
docker logs auth

CHANGES:

1er COMMIT
- Arregladas funciones del GDPR
- Nginx WAF 403 reparado

2do COMMIT
- REFACTORING GLOBAL
- URLS internas hardcodeadas (sin leer de .env)
- Eliminado databaseApiClient en auth, gateway/gdpr, etc
- Eliminado shared/http-client.js
- Servicio user a la espera de ser usado o eliminado
- Operativa user llevado a auth para evitar conflictos ya que en fronend se está usando /api/auth/profile-data
	auth/../user.js en el futuro se puede llevar a otro sitio
- database/routes/query.js ahora se divide en database/routes/users.js y database/routes/sessions.js
- ***/routes/health.js eliminado
- Operativa gdpr llevada a auth

3er COMMIT
- Fix github
- nginx-waf ahora se llama simplemente nginx (tenga o no waf)
- Eliminado servicio redis
- SECRET se guardan y leen en vault
- Resuelta inversión de dependencias shared





PUT está explícitamente prohibido por la política de seguridad por defecto del OWASP CRS.
OWASP CRS bloquea PUT, PATCH y DELETE por defecto porque:
Muchos ataques usan métodos no estándar
APIs REST modernas usan PUT/PATCH, pero CRS es conservador
👉 No es un error, es una decisión de seguridad.



---

  # TODO
- Los SECRETS se generan automaticamente y se guardan en vault
- Mejorar dashboard grafana
- Después de enable 2fa refrescar perfil
- Cosas que traducir (Dejando para el final)
- Lo de modificar (botón UPDATE) y subir avatar (parte gestión de usuarios?)
- Ocultar cosas. Como el botón al configurar 2FA, Profile sin estar autenticado
- si se roba el token puede seguir accediendo a la bd al deslogearse... implementar Refresh Token (guardado en DB o Vault)
  Pierdes la ventaja “stateless”
  Necesitas Redis / DB / Vault

- demostracion de sublogin torneo
- Crear volumem compartido

---

> [!WARNING]
- La web se levanta en https://localhost:8443 por cuestiones del campus
- En el navegador, al usar certificados autofirmado debes aceptar los riesgos
- PELIGRO: make destroy borra todas las imagenes, ... pero es una buena forma de
evitar errores por incompatibilidades con otras versiones
- Se puede acceder a la BD de 2 formas:
  - Directamente accediendo al servicio (Puertos expuestos TEMPORALMENTE) HTTP:
    `http://localhost:3003/users/all`
  - Una vez logeado y con un token valido. HTTPS:
    `https://localhost:8443/api/database/health`


**Para no tener que andar creando usuarios si accedes a http://localhost:3003/users/all se deben ver todos los ya creados, sus datos, etc**


### **Health Checks (ver desde el navegador o curl):**
```bash
# Verificar todos los servicios
curl -k https://localhost:8443/health     # nginx
curl http://localhost:3000/health         # Gateway
curl http://localhost:3001/health         # Auth
curl http://localhost:3002/health         # I18n
curl http://localhost:3003/health         # Database
curl http://localhost:3004/health         # Users
```

### TOOLS

> Para acceder a traves de la api detras de nginx hay que pasarle el token

``` javascript
curl -k https://localhost:8443/api/auth/profile-data \

> Transpilar a ts desde host
npx tsc --watch
```

---


# LO DE ABAJO YA ESTABA (VIEJO/DESACTUALIZADO)


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


## Activar 2fa

Aún no he consegido que sincronice bien con app de android.
La clave del 2fa es el SECRET. Ejemplo: OBHG2SKNGBGHO4TBHZHW6KDBMMXEWM32GZKGGM3IJJSF4QJVJJNA

Es lo que hay que guardar con cuidado, ya que a partir de ese chorizo se generan los códigos de autenticación. En condiciones normales no se muestra por ningún lado... son las app de autenticación (google aut...etc) las encargadas de guardalas mediante el escaneo del código QR. Pero como no van, pongo algunas alternativas para generar códigos.

1 - Hay un botón en el perfil que dirige a https://localhost:8443/users/decode.html, ahí metes el SECRET que aparece al habilitarlo

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

https://localhost:8445/login User/Password:users/admin -> Skip

https://localhost:8445/dashboards
![alt text](_assets/grafa1.png)
![alt text](_assets/grafa2.png)

en https://localhost:8445/a/grafana-metricsdrilldown-app/drilldown vienen muchas más métricas por defecto
![alt text](_assets/grafa3.png)


### URLs de estado de servicios expuestos (todos usan HTTPS)
No se puede incluir como subpath (8443)/grafana porque no lo permiten (O sí?)




docker exec -it vault sh -c "
export VAULT_ADDR='https://localhost:8200'
export VAULT_SKIP_VERIFY=true
vault operator init -key-shares=1 -key-threshold=1
"
```

docker exec -it vault sh -c 'env | grep VAULT'
