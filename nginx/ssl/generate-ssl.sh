#!/bin/bash
openssl genrsa -out private-key.pem 2048
openssl req -new -x509 -key private-key.pem -out certificate.pem -days 365 -subj "/C=ES/ST=Madrid/L=Madrid/O=Dev/CN=localhost"
openssl pkcs12 -export -out certificate.pfx -inkey private-key.pem -in certificate.pem -passout pass:
