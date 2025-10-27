#!/usr/bin/env bash

# Copyright (C) 2024 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

export HF_TOKEN=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
export HUGGINGFACE_API_TOKEN=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
export GROQ_API_KEY=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

export MODEL_CACHE=/home/intel/.cache/huggingface/hub
export host_ip=${ip_address}
export EMBEDDING_MODEL_ID="BAAI/bge-base-en-v1.5"
export RERANK_MODEL_ID="BAAI/bge-reranker-base"
export LLM_MODEL_ID="meta-llama/Meta-Llama-3-8B-Instruct"
export INDEX_NAME="rag-qdrant"
# Set it as a non-null string, such as true, if you want to enable logging facility,
# otherwise, keep it as "" to disable it.
export LOGFLAG="true"

# Set no proxy
export no_proxy="$no_proxy,xeon-ui-server,xeon-backend-server,dataprep-qdrant-service,tei-embedding-service,retriever,tei-reranking-service,qdrant-vector-db,tgi-service,vllm-service,groq-service,jaeger,prometheus,grafana,node-exporter"


export CHATQNA_BACKEND_PORT=8888
export CHATQNA_FRONTEND_SERVICE_PORT=5173
export LLM_ENDPOINT_PORT=8009
export LLM_ENDPOINT="http://${host_ip}:${LLM_ENDPOINT_PORT}"

#----------------------Mongo Configurations----------------------
export MONGO_USERNAME=agents
export MONGO_PASSWORD=agents
export MONGO_HOST=localhost
export MONGO_PORT=27017
export MONGO_DBNAME=lenovo-db
#----------------------------------------------------------------

export MEGA_SERVICE_PORT=8888
export EMBEDDING_SERVER_HOST_IP=localhost
export EMBEDDING_SERVER_PORT=6040
export RETRIEVER_SERVICE_HOST_IP=localhost
export RETRIEVER_SERVICE_PORT=6045
export RERANK_SERVER_HOST_IP=localhost
export RERANK_SERVER_PORT=6041
export LLM_SERVER_HOST_IP=localhost
export LLM_SERVER_PORT=5099


declare -g numa_count=$(lscpu | grep "NUMA node(s):" | awk '{print $3}')
echo $numa_count
if (( numa_count % 2 == 0 )); then
    if (( numa_count == 6 )); then
        export TP_NUM=2
        export PP_NUM=3
    else
        export TP_NUM=$numa_count
	export PP_NUM=1
    fi
else
    export PP_NUM=$numa_count
    export TP_NUM=1
fi
export MAX_BATCHED_TOKENS=2048
export MAX_SEQS=256
export SHOW_METRICS=True