# Copyright (C) 2024 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

import os


#######################################################
#                Common Functions                     #
#######################################################
def get_boolean_env_var(var_name, default_value=False):
    """Retrieve the boolean value of an environment variable.

    Args:
    var_name (str): The name of the environment variable to retrieve.
    default_value (bool): The default value to return if the variable
    is not found.

    Returns:
    bool: The value of the environment variable, interpreted as a boolean.
    """
    true_values = {"true", "1", "t", "y", "yes"}
    false_values = {"false", "0", "f", "n", "no"}

    # Retrieve the environment variable's value
    value = os.getenv(var_name, "").lower()

    # Decide the boolean value based on the content of the string
    if value in true_values:
        return True
    elif value in false_values:
        return False
    else:
        return default_value


# Whether or not to enable langchain debugging
DEBUG = get_boolean_env_var("DEBUG", True)
# Set DEBUG env var to "true" if you wish to enable LC debugging module
if DEBUG:
    import langchain

    langchain.debug = True

# Embedding model
EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-base-en-v1.5")
LOCAL_EMBEDDING_MODEL = os.getenv("LOCAL_EMBEDDING_MODEL", "maidalun1020/bce-embedding-base_v1")
TEI_EMBEDDING_ENDPOINT = os.getenv("TEI_EMBEDDING_ENDPOINT", "")
BRIDGE_TOWER_EMBEDDING = os.getenv("BRIDGE_TOWER_EMBEDDING", False)

HF_TOKEN = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACEHUB_API_TOKEN", "")
ENABLE_SCHEMA = get_boolean_env_var("ENABLE_SCHEMA", False)

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Directory pathss
current_file_path = os.path.abspath(__file__)
parent_dir = os.path.dirname(current_file_path)


#######################################################
#                        QDrant                       #
#######################################################
QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", 6333))
QDRANT_EMBED_DIMENSION = os.getenv("QDRANT_EMBED_DIMENSION", 768)
QDRANT_INDEX_NAME = os.getenv("QDRANT_INDEX_NAME", "rag-qdrant")


# Summarizer Configuration
SUMMARIZER_ENABLED = os.getenv("SUMMARIZER_ENABLED", "false").lower() == "true"

# Embedding configuration
TEI_EMBED_MODEL = os.getenv("TEI_EMBED_MODEL", "BAAI/bge-base-en-v1.5")
TEI_EMBEDDING_ENDPOINT = os.getenv("TEI_EMBEDDING_ENDPOINT")
HF_TOKEN = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACEHUB_API_TOKEN", "")

# VLLM configuration
VLLM_API_KEY = os.getenv("VLLM_API_KEY", "EMPTY")
VLLM_ENDPOINT = os.getenv("VLLM_ENDPOINT")
VLLM_MODEL_ID = os.getenv("VLLM_MODEL_ID", "Intel/neural-chat-7b-v3-3")
VLLM_MAX_NEW_TOKENS = os.getenv("VLLM_MAX_NEW_TOKENS", 512)
VLLM_TOP_P = os.getenv("VLLM_TOP_P", 0.9)
VLLM_TEMPERATURE = os.getenv("VLLM_TEMPERATURE", 0.8)
VLLM_TIMEOUT = os.getenv("VLLM_TIMEOUT", 600)

# OpenAI configuration (alternative to VLLM & TEI)
OPENAI_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o")
OPENAI_CHAT_TEMPERATURE = os.getenv("OPENAI_CHAT_TEMPERATURE", 0)
OPENAI_CHAT_MAX_TOKENS = os.getenv("OPENAI_CHAT_MAX_TOKENS")
OPENAI_EMBED_MODEL = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")
OPENAI_CHAT_ENABLED = os.getenv("OPENAI_CHAT_ENABLED", "true").lower() == "true"
OPENAI_EMBED_ENABLED = os.getenv("OPENAI_EMBED_ENABLED", "true").lower() == "true"

