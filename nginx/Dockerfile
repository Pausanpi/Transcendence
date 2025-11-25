FROM owasp/modsecurity-crs:4.20-nginx-alpine-202511100111
USER root
ENV TZ=Europe/Madrid
COPY modsecurity/waf.conf /etc/nginx/waf.conf
COPY modsecurity/modsecurity.conf /etc/nginx/modsecurity.conf
COPY modsecurity/modsecurity-override.rules /etc/modsecurity.d/modsecurity-override.rules
COPY proxy-headers.conf /etc/nginx/proxy-headers.conf
COPY nginx.conf /etc/nginx/nginx.conf
CMD sh -c "mkdir -p /var/log/nginx /var/log /etc/nginx/ssl && exec nginx -g 'daemon off;'"
