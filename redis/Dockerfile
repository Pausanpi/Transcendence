FROM redis:7.2-alpine

USER root
RUN apk add --no-cache bash && mkdir -p /data && chown redis:redis /data
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
USER redis

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
