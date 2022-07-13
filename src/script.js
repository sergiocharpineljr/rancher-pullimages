axios = require('axios');
axiosRetry = require('axios-retry');
process = require('process');

require('dotenv').config();
var requireEnv = require("require-environment-variables");
requireEnv(['RANCHER_API_URL', 'RANCHER_API_TOKEN', 'REGISTRY_API_URL', 'HARBOR_CACHE_PROJECT']);

const excludedImages = process.env.EXCLUDED_IMAGES_REGEX.split(',');
const cacheProjectName = process.env.HARBOR_CACHE_PROJECT;

var http = axios.create({
    baseURL: process.env.RANCHER_API_URL,
    headers: {'Authorization': `bearer ${process.env.RANCHER_API_TOKEN}`}
});
axiosRetry(http, { retryDelay: (retryCount) => {
    return retryCount * 2000;
}});

async function getClusters() {
    let res = await http.get('clusters');
    return res.data.data;
}

async function getProjectsByCluster(cluster) {
    let res = await http.get(`clusters/${cluster}/projects`);
    return res.data.data;
}

async function getDataByProject(data, projectId) {
    let res = await http.get(`projects/${projectId}/${data}`).catch(function(error){
        console.log(error);
    });
    return res.data.data;
}

async function pullImage(imageName) {
    http_registry = axios.create({
        baseURL: process.env.REGISTRY_API_URL
    });
    axiosRetry(http_registry, { retryDelay: (retryCount) => {
        return retryCount * 2000;
    }});

    // add library to dockerhub images
    if (!imageName.match(/^\w+\/.+/)){
        imageName = `library/${imageName}`;
    }

    let imageNameWithoutTag = imageName.split(':')[0];
    let tag = imageName.split(':')[1];
    if (tag == null){
        tag = "latest";
    }

    // get manifest digest
    console.log(`${cacheProjectName}/${imageNameWithoutTag}/manifests/${tag}`);
    let res = await http_registry.get(`${cacheProjectName}/${imageNameWithoutTag}/manifests/${tag}`);

    if (res.data.hasOwnProperty('manifests')){
        console.log('Obtendo através do manifest');
        let manifests = res.data.manifests;
        for (manifest of manifests) {
            if (manifest.platform.architecture === "amd64" & manifest.platform.os === "linux"){
                console.log(`${cacheProjectName}/${imageNameWithoutTag}/manifests/${manifest.digest}`);
                await http_registry.get(`${cacheProjectName}/${imageNameWithoutTag}/manifests/${manifest.digest}`)
            }
        }
    }
}

async function main() {
    let images = []

    let clusters = await getClusters();
    // loop clusters
    for (const cluster of clusters) {
        console.log(`Obtendo imagens do cluster ${cluster.id} - ${cluster.name}`);
        let projects = await getProjectsByCluster(cluster.id);
        // loop projects
        for (const project of projects) {
            console.log(`Obtendo imagens do projeto ${project.id} - ${project.name}`);
            let workloads = await getDataByProject('workloads', project.id);
            // loop workloads
            for (const workload of workloads) {
                // loop containers
                for (const container of workload.containers) {
                    if (excludedImages != null){
                        let bypass = false;
                        for (const regex of excludedImages){
                            if (container.image.match(regex)){
                                //console.log (`Bypass da imagem ${container.image} do projeto ${project.id} - ${project.name}`)
                                bypass = true;
                                break;
                            }
                        }
                        if (!bypass){
                            images.push(container.image);
                        }
                    }
                }
            }
        }
    }
    const uniqImages = new Set(images);
    for (image of uniqImages){
        //cut projectName from image names
        let re = new RegExp(`^${cacheProjectName.replace('.', '\\.')}\/`);
        image = image.replace(re, '');

        // skip images from another repositories than Docker Hub
        if (image.match(/^\w+\.[\w\.:]+\/.*/)){
            console.log(`Skipping image ${image} because it is not from Docker Hub`)
            continue;
        }

        console.log(`Obtendo imagem ${image}`);
        await pullImage(image);
    }
}

main();
