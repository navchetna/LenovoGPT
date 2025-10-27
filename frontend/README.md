# AI Agents


## Setup

1. Clone repo
```
https://github.com/navchetna/ai-agents
```
2. Move to project repo
```
cd ai-agents/frontend;
```

### Docker setup

#### Build image

```
export SERVER_URL=<server_host>:<port>
export DATAPREP_URL=<dataprep_host>:<port>
docker buildx build --build-arg https_proxy=$https_proxy --build-arg http_proxy=$http_proxy --build-arg SERVER_URL=${SERVER_URL} --build-arg DATAPREP_URL=${DATAPREP_URL}  -t ai-agents/rag/ui:latest -f install/docker/Dockerfile .;  
```

> Note: host would be localhost for local dev or server hostname for remote server

#### Run container

```
docker run -p 3000:3000 -e http_proxy=$http_proxy -e https_proxy=$https_proxy ai-agents/rag/ui:latest
```

### Local Setup

1. Install dependencies
```
make build-ui;
```
2. Start UI server
```
make ui;
```

> Note
> Please make sure to use WSL/Linux environment for running above
