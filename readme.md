# Rancher YALMs to GIT

This docker image forces all Rancher container images to be downloaded to Harbor cache repository.

## How to use

``` bash
docker run --rm -it -e RANCHER_API_URL='<<url rancher api>>' \
-e RANCHER_API_TOKEN='<<Rancher API Bearer Token>>' \
-e REGISTRY_API_URL='<<URL do registry do Harbor>>' \
-e EXCLUDED_IMAGES_REGEX='<<CSV de regex de imagens para bypass>>' \
-e HARBOR_CACHE_PROJECT='<<Nome do projeto de cache do Harbor>>' \ images:tag
```
