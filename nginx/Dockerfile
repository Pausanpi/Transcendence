FROM owasp/modsecurity-crs:4.20-nginx-alpine-202511100111

USER root
RUN mkdir -p /var/log/nginx /var/log /etc/nginx/ssl
COPY ssl /etc/nginx/conf/

COPY modsecurity/modsecurity-override.conf \
  /etc/nginx/templates/modsecurity.d/modsecurity-override.conf.template

COPY proxy-headers.conf /etc/nginx/conf.d/proxy-headers.conf
COPY 00-log-formats.conf /etc/nginx/conf.d/00-log-formats.conf
COPY 00-nginx.conf /etc/nginx/conf.d/00-nginx.conf

CMD ["nginx", "-g", "daemon off;"]
