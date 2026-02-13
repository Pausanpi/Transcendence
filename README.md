*This project has been created as part of the 42 curriculum by csubires, joestrad, lcuevas-, pausanch.*

# Description

**ft_transcendence** is the final coding project in the 42 common cursus. It serves as proof of a complete skillset from the team, demonstrating both hard technical skills and soft skills like teamwork.

Transcendence is a full-stack project. The goal is to automate the deployment of an entire server with a service-oriented architecture, accessible through a standard web browser. This requires building a frontend, backend, and database, all orchestrated to work together with a single command (`make`).

The project uses a Makefile to orchestrate Docker Compose, launching multiple containers that each encapsulate a part of the project. Each container is mostly independent and includes all necessary dependencies.

Our implementation is a games platform where users can play Pong and other games, register accounts, and view their game history. The system uses a microservices architecture and includes robust cybersecurity features to protect the backend and database from potential attacks originating from the frontend.

# Instructions

## Prerequisites

- **Make**: Ensure you have GNU Make installed to run the Makefile.
- **Docker**: Required to build and run the containers.
- **Docker Compose**: Used by the Makefile to orchestrate the multi-container setup.


NOTA:  DE MOMENTO NO HE PUESTO NADA DEL ENV, SI HICIERA FALTA SE MENCIONA Y TAL

To run this project, simply execute `make` in the root directory. This command will automatically build and start all required services using Docker Compose.

Once the setup is complete, open your web browser (the project is designed for Google Chrome) and navigate to https://localhost:8443.

From there, you will be able to access the main page, where you can register a new account, log in, play games, and explore the available features through intuitive menus.

# Resources

## Classic References
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Database Design Basics (Microsoft)](https://learn.microsoft.com/en-us/office/troubleshoot/access/database-design-basics)
- [SQL Tutorial (W3Schools)](https://www.w3schools.com/sql/)

- [Docker Documentation](https://docs.docker.com/)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [MDN Web Docs (HTML, CSS, JS)](https://developer.mozilla.org/)
- [OWASP Top Ten Security Risks](https://owasp.org/www-project-top-ten/)

- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [NGINX Documentation](https://nginx.org/en/docs/)
- [ModSecurity Handbook](https://www.modsecurity.org/documentation.html)
- [JWT (JSON Web Token) Introduction](https://jwt.io/introduction)
- [Web Application Firewall (WAF) Overview](https://owasp.org/www-community/Web_Application_Firewall)
- [i18next Documentation (Internationalization)](https://www.i18next.com/)

- [Vault by HashiCorp Documentation](https://developer.hashicorp.com/vault/docs)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

- [Fetch API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [Fastify Multipart Plugin](https://www.fastify.io/docs/latest/Reference/Multipart/)
- [Axios Documentation](https://axios-http.com/docs/intro)

### Project Modules and Containers

- **auth**: Handles authentication, 2FA, and user security.
- **base**: Core logic and shared utilities.
- **database**: Manages user data, matches, and persistent storage.
- **frontend**: User interface, game logic, and client-side features (TypeScript, Tailwind CSS).
- **gateway**: API gateway and routing.
- **grafana**: Monitoring and dashboards.
- **i18n**: Internationalization and language support.
- **nginx**: Reverse proxy, load balancing, and WAF (with ModSecurity).
- **prometheus**: Metrics and monitoring.
- **shared**: Shared configuration and code.
- **users**: User management services.
- **vault**: Secrets management and secure storage.

## AI Usage

AI tools (such as GitHub Copilot and ChatGPT) were primarily used to help understand and document code written by other team members, as well as to assist in modifying and extending existing modules.

Additionally, AI was used in a limited way for code generation, documentation review, and troubleshooting errors.

No AI models were integrated into the production code or user-facing features.


# Team Information

**csubires**  
Roles: Technical Lead, Developer  
Responsibilities:
- Lead cybersecurity development
- Code reviews for development updates
- Reviews of microservices structure

**joestrad**  
Roles: Developer  
Responsibilities:
- Frontend development and refinement
- Main developer for the tournament module
- Testing and documentation reviews

**lcuevas-**  
Roles: Project Manager (PM), Developer  
Responsibilities:
- Organizes meetings and tracks weekly progress
- Coordinates team communication, versioning, and decision-making
- Implements features and final product versions
- Develops containerization and microservices deployment
- Main developer for user management and database modules

**pausanch**  
Roles: Product Owner (PO), Developer  
Responsibilities:
- Initial project schematization
- Lead developer for frontend and games modules
- Testing and documentation reviews

All members participate in code reviews, testing, and documentation. Roles overlapped as needed throughout module development.

# Project Management

## Organization
In the first phase, we held weekly meetings to distribute tasks. This stage focused on investigating the technologies needed to complete the modules and establishing a basic structure, which would later be improved and refined from mock-up builds. Each week, we met to discuss challenges, review how the modules interacted, and present the general structure and tools being used, as well as those intended for the final production version.
During this stage, every member chose their preferred modules, and we agreed on task distribution accordingly.

In the second stage, we concentrated on continuous development, fleshing out the modules. We shifted to a more remote approach, with team members regularly updating each other on their progress and pushing changes to the repositories. Every update to the development branch required a code review from another team member. If an update needed extra explanation, we would meet as necessary.


## Tools Used
Project management tools:
	- Git and GitHub for version control, code reviews, and collaboration.
	- Pen and paper for brainstorming, sketching schemas, and planning.
	- Canva and online flowchart tools for creating diagrams of project containers, services, and database structure.
	- No formal project management software was used; most coordination was handled directly through GitHub and informal discussions.

## Communication
Communication channels:
  - WhatsApp for informal personal updates and organizing meetings.
  - Slack for technical discussions and sharing small documents.
  - GitHub for project collaboration and code reviews.

# Technical Stack

## Frontend
- Technologies and frameworks used.

## Backend
- Technologies and frameworks used.

## Database
- System used and justification for choice.

## Other Technologies
- Any other significant technologies or libraries.
- Justification for major technical choices.

# Database Schema

- Visual representation or description of the database structure.
- Tables/collections and their relationships.
- Key fields and data types.

# Features List

- Complete list of implemented features.
- Which team member(s) worked on each feature.
- Brief description of each feature’s functionality.

# Modules

- List of all chosen modules (Major and Minor).
- Point calculation (Major = 2pts, Minor = 1pt).
- Justification for each module choice, especially for custom "Modules of choice".
- How each module was implemented.
- Which team member(s) worked on each module.

# Individual Contributions

- Detailed breakdown of what each team member contributed.
- Specific features, modules, or components implemented by each person.
- Any challenges faced and how they were overcome.

# Other Information

- Usage documentation, known limitations, license, credits, etc.













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

