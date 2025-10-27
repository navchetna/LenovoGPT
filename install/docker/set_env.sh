#!/usr/bin/env bash

export HTTP_PROXY=$HTTP_PROXY
export HTTPS_PROXY=$HTTPS_PROXY
export http_proxy=$http_proxy
export https_proxy=$https_proxy

# Copyright (C) 2024 Intel Corporation
# SPDX-License-Identifier: Apache-2.0
export HF_TOKEN=
export HUGGINGFACEHUB_API_TOKEN=
export GROQ_API_KEY=

export MODEL_CACHE=/mnt/hf_cache
# export host_ip=${ip_address}
export EMBEDDING_MODEL_ID="BAAI/bge-base-en-v1.5"
export RERANK_MODEL_ID="BAAI/bge-reranker-base"
export LLM_MODEL_ID="meta-llama/Meta-Llama-3-8B-Instruct"
export INDEX_NAME="rag-qdrant"
# Set it as a non-null string, such as true, if you want to enable logging facility,
# otherwise, keep it as "" to disable it.
export LOGFLAG="true"

# Set no proxy
export no_proxy="$no_proxy,xeon-ui-server,xeon-backend-server,dataprep-qdrant-service,tei-embedding-service,retriever,tei-reranking-service,qdrant-vector-db,tgi-service,vllm-service,groq-service,jaeger,prometheus,grafana,node-exporter"

export LLM_ENDPOINT_PORT=8000
export LLM_SERVER_PORT=8000
export CHATQNA_BACKEND_PORT=8888
export CHATQNA_FRONTEND_SERVICE_PORT=3000
export NGINX_PORT=80
export FAQGen_COMPONENT_NAME="OpeaFaqGenvLLM"
export LLM_ENDPOINT="http://${host_ip}:${LLM_ENDPOINT_PORT}"

export MAX_BATCHED_TOKENS=2048
export MAX_SEQS=256


# ==============================================================================
export JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# NEXT_PUBLIC_API_BASE_URL=http://localhost:8888
# NEXT_PUBLIC_DB_NAME=lenovo-db

export NEXT_PUBLIC_API_BASE_URL=http://10.138.186.78:8888
export NEXT_PUBLIC_DB_NAME=lenovo-db