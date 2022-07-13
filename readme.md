# Rancher YALMs to GIT

## Objetivo

Este script tem o objetivo de manter todas as imagens em cache no Harbor.

## Como Utilizar

Esta imagem está disponível via docker image e pode ser utilizada da seguinte forma:

``` bash
docker run --rm -it -e RANCHER_API_URL='<<url rancher api>>' \
-e RANCHER_API_TOKEN='<<Rancher API Bearer Token>>' \
-e REGISTRY_API_URL='<<URL do registry do Harbor>>' \
-e EXCLUDED_IMAGES_REGEX='<<CSV de regex de imagens para bypass>>' \
-e HARBOR_CACHE_PROJECT='<<Nome do projeto de cache do Harbor>>' \ images:tag
```
