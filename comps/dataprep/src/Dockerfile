# Copyright (C) 2024 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

FROM python:3.11-slim

ENV LANG=C.UTF-8

ARG ARCH="cpu"

RUN apt-get update -y && apt-get install -y --no-install-recommends --fix-missing \
    build-essential \
    default-jre \
    git \
    libcairo2 \
    libjemalloc-dev \
    libmariadb-dev \
    libpq-dev \
    libreoffice \
    poppler-utils \
    tesseract-ocr \
    ffmpeg \
    wget curl

RUN useradd -m -s /bin/bash user && \
    mkdir -p /home/user && \
    chown -R user /home/user/

COPY comps /home/user/comps

ARG uvpip='uv pip install --system --no-cache-dir'
RUN pip install --no-cache-dir --upgrade pip setuptools uv && \
    $uvpip torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    $uvpip -r /home/user/comps/dataprep/src/requirements-cpu.txt

ENV PYTHONPATH=$PYTHONPATH:/home/user

RUN mkdir -p /home/user/comps/dataprep/src/uploaded_files && chown -R user /home/user/comps/dataprep/src/uploaded_files
RUN mkdir -p /data && chown -R user /data
# Create the 'out' directory with proper permissions
RUN mkdir -p /home/user/comps/dataprep/src/out && chown -R user:user /home/user/comps/dataprep/src/out

# Make site-packages writable for non-root user to allow runtime package operations
RUN chown -R user:user /usr/local/lib/python3.11/site-packages

USER user
ENV NLTK_DATA=/home/user/nltk_data
# air gapped support: predownload all needed nltk data
RUN mkdir -p /home/user/nltk_data && python -m nltk.downloader -d /home/user/nltk_data punkt_tab averaged_perceptron_tagger_eng stopwords
# air gapped support: set model cache dir
ENV HF_HUB_CACHE=/data

WORKDIR /home/user/comps/dataprep/src

ENTRYPOINT ["sh", "-c", "python $( [ \"$MULTIMODAL_DATAPREP\" = \"true\" ] && echo 'opea_dataprep_multimodal_microservice.py' || echo 'opea_dataprep_microservice.py')"]
