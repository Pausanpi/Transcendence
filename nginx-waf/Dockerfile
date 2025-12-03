FROM owasp/modsecurity-crs:nginx-alpine

USER root

RUN apk add --no-cache openssl

RUN mkdir -p /etc/nginx/ssl

COPY start_nginx.sh /usr/local/bin/start_nginx.sh
RUN chmod +x /usr/local/bin/start_nginx.sh

# Use template so base image entrypoint processes it
COPY default.conf.template /etc/nginx/templates/conf.d/default.conf.template

ENTRYPOINT ["/usr/local/bin/start_nginx.sh"]

CMD ["nginx", "-g", "daemon off;"]