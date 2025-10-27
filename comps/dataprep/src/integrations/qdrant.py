# Copyright (C) 2024 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

import json
import os
from typing import List, Optional, Union

from fastapi import Body, File, Form, HTTPException, UploadFile
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceBgeEmbeddings, HuggingFaceInferenceAPIEmbeddings
from langchain_community.vectorstores import Qdrant
from langchain_huggingface import HuggingFaceEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.http import models

from comps import CustomLogger, DocPath, OpeaComponent, OpeaComponentRegistry, ServiceType
from comps.cores.proto.api_protocol import DataprepRequest
from comps.dataprep.src.utils import (
    document_loader,
    encode_filename,
    get_separators,
    get_tables_result,
    parse_html_new,
    save_content_to_local_disk,
)
from comps.parsers.treeparser import TreeParser
from comps.parsers.tree import Tree
from comps.parsers.node import Node
from comps.parsers.text import Text
from comps.parsers.table import Table

import requests

logger = CustomLogger("opea_dataprep_qdrant")
logflag = os.getenv("LOGFLAG", False)

# Embedding model
EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-base-en-v1.5")

# Qdrant configuration
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
DEFAULT_COLLECTION_NAME = os.getenv("COLLECTION_NAME", "rag-qdrant")

# LLM/Embedding endpoints
TGI_LLM_ENDPOINT = os.getenv("TGI_LLM_ENDPOINT", "http://localhost:8080")
TGI_LLM_ENDPOINT_NO_RAG = os.getenv("TGI_LLM_ENDPOINT_NO_RAG", "http://localhost:8081")
TEI_EMBEDDING_ENDPOINT = os.getenv("TEI_EMBEDDING_ENDPOINT", "")
HF_TOKEN = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACEHUB_API_TOKEN", "")

@OpeaComponentRegistry.register("OPEA_DATAPREP_QDRANT")
class OpeaQdrantDataprep(OpeaComponent):
    """Dataprep component for Qdrant ingestion and search services."""

    def __init__(self, name: str, description: str, config: dict = None):
        super().__init__(name, ServiceType.DATAPREP.name.lower(), description, config)
        self.upload_folder = "./uploaded_files/"
        if TEI_EMBEDDING_ENDPOINT:
            if not HF_TOKEN:
                raise HTTPException(
                    status_code=400,
                    detail="You MUST offer the `HF_TOKEN` when using `TEI_EMBEDDING_ENDPOINT`.",
                )
            import requests

            response = requests.get(TEI_EMBEDDING_ENDPOINT + "/info")
            if response.status_code != 200:
                raise HTTPException(
                    status_code=400, detail=f"TEI embedding endpoint {TEI_EMBEDDING_ENDPOINT} is not available."
                )
            model_id = response.json()["model_id"]
            self.embedder = HuggingFaceInferenceAPIEmbeddings(
                api_key=HF_TOKEN, model_name=model_id, api_url=TEI_EMBEDDING_ENDPOINT
            )
        else:
            self.embedder = HuggingFaceEmbeddings(model_name=EMBED_MODEL)

        self.client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
        health_status = self.check_health()
        if not health_status:
            logger.error("OpeaQdrantDataprep health check failed.")

        self.tree_parser = TreeParser()

    def check_health(self) -> bool:
        """Checks the health of the Qdrant service."""
        if self.embedder is None:
            logger.error("Qdrant embedder is not initialized.")
            return False

        try:
            logger.info(self.client.get_info())
            return True
        except Exception as e:
            logger.error(f"Qdrant health check failed: {e}")
            return False

    def collection_exists(self, collection_name: str) -> bool:
        """Checks if a collection exists in Qdrant."""
        try:
            self.client.get_collection(collection_name)
            return True
        except Exception:
            return False

    def invoke(self, *args, **kwargs):
        pass

    def get_table_description(self, item: Table):
        server_host_ip = os.getenv("LLM_SERVER_HOST_IP", "localhost")
        server_port = os.getenv("LLM_SERVER_PORT", 8000)
        model_name = os.getenv("LLM_MODEL_ID")
        use_model_param = os.getenv("LLM_USE_MODEL_PARAM", "false").lower() == "true"
        url = f"http://{server_host_ip}:{server_port}/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Accept": "text/event-stream"
        }

        data = {
            "messages": [
                {
                    "role": "system",
                    "content": """
                        <s>[INST] <<SYS>>\n You are a helpful, respectful, and honest assistant. Your task is to generate a detailed and descriptive summary of the provided table data in Markdown format, based strictly on the table and its heading. <</SYS>> 
                        [INST] Your job is to create a clear, specific, and **factual** textual description. **Do not add any external information** or provide an abstract summary. Only base the description on the data from the table and its heading.
                        
                        1. Link the **columns** with the corresponding **values** in the rows, referencing the exact terms and terminology from the table. 
                        2. For each row, explain how each column's data relates to the corresponding values. Ensure the description is **step-by-step** and follows the structure of the table in a natural order.
                        3. **Do not return the table itself.** Provide only the descriptive summary, written in **paragraphs**.
                        4. The description should be precise, direct, and **avoid interpretation** or generalization. Stay true to the exact data given.
                        
                        Think carefully and make sure to describe every column and its respective values in detail. 
                    """
                },
                {
                    "role": "user",
                    "content": f"{item.heading}\n{item.markdown_content}",
                }
            ],
            "stream": False
        }

        if use_model_param and model_name:
            data["model"] = model_name
        else:
            data["file_name"] = ""

        response = requests.post(url, headers=headers, json=data)
        import sys
        print(f"DEBUG - Request URL: {url}", file=sys.stderr)
        print(f"DEBUG - Request data: {data}", file=sys.stderr)
        print(f"DEBUG - Response status: {response.status_code}", file=sys.stderr)
        print(f"DEBUG - Response text: '{response.text}'", file=sys.stderr)
        response_data = json.loads(response.text)
        return response_data['choices'][0]['message']['content']

    def chunk_node_content(self, node: Node, text_splitter: RecursiveCharacterTextSplitter):
        content = node.get_content()
        chunks = []
        for item in content:
            if isinstance(item, Text):
                text_chunks = text_splitter.split_text(item.content)
                chunks.extend(text_chunks)
            if isinstance(item, Table):
                table_description = self.get_table_description(item)
                table_description_chunks = text_splitter.split_text(table_description)
                chunks.extend(table_description_chunks)
        return chunks

    def create_chunks(self, node: Node, text_splitter: RecursiveCharacterTextSplitter):
        node_chunks = self.chunk_node_content(node, text_splitter)
        total = node.get_length_children()
        for i in range(total):
            node_chunks.extend(self.create_chunks(node.get_child(i), text_splitter))
        return node_chunks

    async def ingest_data_to_qdrant(self, doc_path: DocPath, collection_name: str):
        """Ingest document to Qdrant using tree parsing logic."""
        path = doc_path.path
        if logflag:
            logger.info(f"Parsing document {path} for collection {collection_name}.")

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=doc_path.chunk_size,
            chunk_overlap=doc_path.chunk_overlap,
            add_start_index=True,
            separators=get_separators(),
        )

        tree = Tree(path)
        self.tree_parser.populate_tree(tree)
        self.tree_parser.generate_output_text(tree)

        self.tree_parser.generate_output_json(tree)
        chunks = self.create_chunks(tree.rootNode, text_splitter)

        structured_types = [".xlsx", ".csv", ".json", "jsonl"]
        _, ext = os.path.splitext(path)
        if ext in structured_types:
            content = await document_loader(path)
            chunks = content

        if doc_path.process_table and path.endswith(".pdf"):
            table_chunks = get_tables_result(path, doc_path.table_strategy)
            if table_chunks:
                chunks.extend(table_chunks)
            else:
                logger.info(f"No additional table chunks found in {path}.")

        if logflag:
            logger.info(f"Done preprocessing. Created {len(chunks)} chunks of the original file.")

        if not self.collection_exists(collection_name):
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
            )

        batch_size = 32
        num_chunks = len(chunks)
        for i in range(0, num_chunks, batch_size):
            batch_chunks = chunks[i : i + batch_size]
            batch_texts = batch_chunks

            _ = Qdrant.from_texts(
                texts=batch_texts,
                embedding=self.embedder,
                collection_name=collection_name,
                host=QDRANT_HOST,
                port=QDRANT_PORT,
            )
            if logflag:
                logger.info(f"Processed batch {i//batch_size + 1}/{(num_chunks-1)//batch_size + 1} for collection {collection_name}")

        return True

    async def ingest_files(
        self,
        input: DataprepRequest,
        collection_name: Optional[str] = DEFAULT_COLLECTION_NAME,
    ):
        """Ingest files/links content into qdrant database.

        Save in the format of vector[768].
        Returns '{"status": 200, "message": "Data preparation succeeded"}' if successful.
        Args:
            input (DataprepRequest): Model containing the following parameters:
                files (Union[UploadFile, List[UploadFile]], optional): A file or a list of files to be ingested. Defaults to File(None).
                link_list (str, optional): A list of links to be ingested. Defaults to Form(None).
                chunk_size (int, optional): The size of the chunks to be split. Defaults to Form(1500).
                chunk_overlap (int, optional): The overlap between chunks. Defaults to Form(100).
                process_table (bool, optional): Whether to process tables in PDFs. Defaults to Form(False).
                table_strategy (str, optional): The strategy to process tables in PDFs. Defaults to Form("fast").
                collection_name (Optional[str]): The Qdrant collection to ingest into. Defaults to env var COLLECTION_NAME.
        """
        files = input.files
        link_list = input.link_list
        chunk_size = input.chunk_size
        chunk_overlap = input.chunk_overlap
        process_table = input.process_table
        table_strategy = input.table_strategy

        if logflag:
            logger.info(f"files:{files}")
            logger.info(f"link_list:{link_list}")
            logger.info(f"Ingesting into collection: {collection_name}")

        if files:
            if not isinstance(files, list):
                files = [files]
            uploaded_files = []
            for file in files:
                encode_file = encode_filename(file.filename)
                save_path = self.upload_folder + encode_file
                await save_content_to_local_disk(save_path, file)
                await self.ingest_data_to_qdrant(
                    DocPath(
                        path=save_path,
                        chunk_size=chunk_size,
                        chunk_overlap=chunk_overlap,
                        process_table=process_table,
                        table_strategy=table_strategy,
                    ),
                    collection_name=collection_name,
                )
                uploaded_files.append(save_path)
                if logflag:
                    logger.info(f"Successfully saved file {save_path} to collection {collection_name}")
            result = {"status": 200, "message": "Data preparation succeeded"}
            if logflag:
                logger.info(result)
            return result

        if link_list:
            link_list = json.loads(link_list)  # Parse JSON string to list
            if not isinstance(link_list, list):
                raise HTTPException(status_code=400, detail="link_list should be a list.")
            for link in link_list:
                encoded_link = encode_filename(link)
                save_path = self.upload_folder + encoded_link + ".txt"
                content = parse_html_new([link], chunk_size=chunk_size, chunk_overlap=chunk_overlap)
                try:
                    await save_content_to_local_disk(save_path, content)
                    await self.ingest_data_to_qdrant(
                        DocPath(
                            path=save_path,
                            chunk_size=chunk_size,
                            chunk_overlap=chunk_overlap,
                            process_table=process_table,
                            table_strategy=table_strategy,
                        ),
                        collection_name=collection_name,
                    )
                except json.JSONDecodeError:
                    raise HTTPException(status_code=500, detail="Fail to ingest data into qdrant.")

                if logflag:
                    logger.info(f"Successfully saved link {link} to collection {collection_name}")

            result = {"status": 200, "message": "Data preparation succeeded"}
            if logflag:
                logger.info(result)
            return result

        raise HTTPException(status_code=400, detail="Must provide either a file or a string list.")

    async def get_files(self, collection_name: Optional[str] = DEFAULT_COLLECTION_NAME):
        """Get file structure from Qdrant collection in the format of
        {
            "name": "File Name",
            "id": "File Name",
            "type": "File",
            "parent": "",
        }"""
        if not self.collection_exists(collection_name):
            raise HTTPException(status_code=404, detail=f"Collection {collection_name} does not exist.")

        result = self.client.scroll(
            collection_name=collection_name,
            limit=100,
            with_payload=True,
        )
        files = set()
        file_structure = []
        for point in result[0]:
            if 'metadata' in point.payload and 'file_path' in point.payload['metadata']:
                file_path = point.payload['metadata']['file_path']
                if file_path not in files:
                    files.add(file_path)
                    file_structure.append({
                        "name": os.path.basename(file_path),
                        "id": file_path,
                        "type": "File",
                        "parent": "",
                    })

        if logflag:
            logger.info(f"Retrieved files from collection {collection_name}: {file_structure}")
        return file_structure

    async def delete_files(self, file_path: str = Body(..., embed=True), collection_name: Optional[str] = DEFAULT_COLLECTION_NAME):
        """Delete file according to `file_path` from the specified collection.

        `file_path`:
            - specific file path (e.g. /path/to/file.txt): delete points related to this file
            - "all": delete all points in the collection
        """
        if not self.collection_exists(collection_name):
            raise HTTPException(status_code=404, detail=f"Collection {collection_name} does not exist.")

        if file_path == "all":
            self.client.delete_collection(collection_name)
            if logflag:
                logger.info(f"Deleted all files from collection {collection_name}")
            return {"status": 200, "message": f"All files deleted from collection {collection_name}"}
        else:
            self.client.delete(
                collection_name=collection_name,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="metadata.file_path",
                                match=models.MatchValue(value=file_path),
                            )
                        ]
                    )
                ),
            )
            if logflag:
                logger.info(f"Deleted file {file_path} from collection {collection_name}")
            return {"status": 200, "message": f"File {file_path} deleted from collection {collection_name}"}

    async def get_list_of_collections(self):
        """Get list of all collections in Qdrant."""
        collections = self.client.get_collections()
        collection_names = [col.name for col in collections.collections]
        if logflag:
            logger.info(f"List of collections: {collection_names}")
        return collection_names
