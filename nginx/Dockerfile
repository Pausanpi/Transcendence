FROM nginx:alpine

RUN apk add --no-cache openssl

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY start_nginx.sh /usr/local/bin/start_nginx.sh
RUN chmod +x /usr/local/bin/start_nginx.sh

RUN mkdir -p /etc/nxing/ssl

ENTRYPOINT ["/usr/local/bin/start_nginx.sh"]

CMD ["nginx", "-g", "daemon off;"]
