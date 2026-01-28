# LO NUEVO

docker stop prometheus
docker rm prometheus
docker rmi prometheus
docker volume prune -f
docker compose up -d prometheus
docker ps -a
docker logs prometheus

docker stop vault
docker rm vault
docker rmi vault

docker stop grafana
docker rm grafana
docker rmi grafana
docker volume prune -f
docker compose up -d grafana
docker ps -a
docker logs grafana

CHANGES:

1er COMMIT
- grafana pseudoconfigurado


---

  # TODO AUTH+
- 2fa con movil
- Después de enable 2fa refrescar perfil y ocultar boton
- Lo de modificar (botón UPDATE) nickname y subir avatar
- Ocultar cosas. Como el botón al configurar 2FA, Profile sin estar autenticado
- si se roba el token puede seguir accediendo a la bd al deslogearse... implementar Refresh Token (guardado en DB o Vault)
  Pierdes la ventaja “stateless”
  Necesitas Redis / DB / Vault
- Hacer que si gateway falla, nginx en vez de 404 muestre estaticos?

- Crear volumem compartido
- Normalizar rutas apiproxy

--- (Dejando para el final)
- Cosas que traducir
- Mejorar dashboard grafana
- Dependencias circulares
- Probar a montar el tsc en user
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
