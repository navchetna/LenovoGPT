
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Tooltip,
  CircularProgress,
  Paper,
  Collapse,
  Fade,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import axios from 'axios';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import DescriptionIcon from '@mui/icons-material/Description';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AddIcon from '@mui/icons-material/Add';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import CloseIcon from '@mui/icons-material/Close';
import ComputerIcon from '@mui/icons-material/Computer';
import { CHAT_QNA_URL } from '@/lib/constants';

interface User {
  id: string;
  name: string;
  email: string;
  departments: string[];
  role: string;
  status: string;
  created_at: string;
}

interface Metrics {
  ttft: number;
  output_tokens: number;
  throughput: number;
  e2e_latency: number;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  preview?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | string;
  content: string;
  timestamp: string;
  quality?: 'good' | 'bad';
  sources?: Array<{
    source: string;
    relevance_score: number;
    content: string;
  }>;
  metrics?: Metrics | null;
  isPending?: boolean;
  isStreaming?: boolean;
  isThinking?: boolean;
  attachedFiles?: UploadedFile[];
}

interface ChatAreaProps {
  conversationId: string | null;
  onTogglePDFViewer: () => void;
  isPDFViewerOpen: boolean;
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  onContextChange: (context: string) => void;
  onSelectConversation: (id: string) => void;
  onConversationUpdated?: () => void;
  updateConversationList?: () => void;
  currentDepartment: string;
  currentUser?: User | null;
}

export default function ChatArea({
  conversationId,
  onSelectConversation,
  onConversationUpdated,
  updateConversationList,
  currentDepartment,
  currentUser
}: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReferences, setShowReferences] = useState<{ [key: string]: boolean }>({});
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationId);
  const [showNewChatPrompt, setShowNewChatPrompt] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [streamingContent, setStreamingContent] = useState<{ [key: string]: string }>({});
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMenuAnchor, setUploadMenuAnchor] = useState<null | HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const displayMessages = currentConversationId
    ? [...messages, ...localMessages.filter(msg => msg.isPending || msg.isStreaming)]
    : localMessages;

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, streamingContent]);

  useEffect(() => {
    if (conversationId) {
      setCurrentConversationId(conversationId);
      loadConversation(conversationId);
      setShowWelcome(false);
      setLocalMessages([]);
    } else {
      setShowNewChatPrompt(true);
      setMessages([]);
      setShowWelcome(true);
      setCurrentConversationId(null);
      setLocalMessages([]);
    }
  }, [conversationId]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadConversation = async (id: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await axios.get(`${CHAT_QNA_URL}/api/conversations/${id}?db_name=lenovo-db`);
      const data = response.data;

      if (!data.history || !Array.isArray(data.history) || data.history.length === 0) {
        return;
      }

      const formattedMessages: Message[] = [];
      data.history.forEach((turn: any, index: number) => {
        if (turn.question) {
          const questionContent = typeof turn.question === 'string'
            ? turn.question
            : turn.question.content || '';

          const timestamp = turn.question.timestamp ||
            turn.timestamp ||
            new Date().toISOString();

          formattedMessages.push({
            id: `${timestamp}-user-${index}`,
            role: 'user',
            content: questionContent,
            timestamp: timestamp,
            attachedFiles: turn.question.attachedFiles || [],
          });
        }

        if (turn.answer) {
          const answerContent = typeof turn.answer === 'string'
            ? turn.answer
            : turn.answer.content || '';

          const timestamp = turn.answer.timestamp ||
            (Number(new Date(turn.timestamp || 0)) + 1).toString() ||
            new Date().toISOString();

          formattedMessages.push({
            id: `${timestamp}-assistant-${index}`,
            role: 'assistant',
            content: answerContent,
            timestamp: timestamp,
            sources: turn.sources || turn.context || [],
            metrics: turn.metrics || null
          });
        }
      });

      if (formattedMessages.length > 0) {
        setMessages(formattedMessages);
        setLocalMessages([]);
      }

    } catch (error: unknown) {
      console.error('Error loading conversation:', error);
      let errorMessage = 'Error loading conversation data';

      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setErrorMessage(errorMessage);
      setShowErrorSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newFiles: UploadedFile[] = [];

    Array.from(files).forEach((file, index) => {
      const fileId = `${Date.now()}-${index}`;
      const uploadedFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
          setUploadedFiles(prev => 
            prev.map(f => f.id === fileId ? uploadedFile : f)
          );
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(uploadedFile);
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleUploadMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUploadMenuAnchor(event.currentTarget);
  };

  const handleUploadMenuClose = () => {
    setUploadMenuAnchor(null);
  };

  const triggerFileInput = (accept?: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept || '*';
      fileInputRef.current.click();
    }
    handleUploadMenuClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon fontSize="small" />;
    if (fileType.includes('pdf')) return <PictureAsPdfIcon fontSize="small" />;
    if (fileType.includes('text') || fileType.includes('document')) return <TextSnippetIcon fontSize="small" />;
    return <AttachFileIcon fontSize="small" />;
  };

  const startNewConversation = async (userMessageContent: string): Promise<string | null> => {
    try {
      const response = await axios.post(`${CHAT_QNA_URL}/api/conversations/new`, {
        db_name: 'lenovo-db'
      });

      const data = await response.data;
      const newConversationId = data.conversation_id;
      setCurrentConversationId(newConversationId);
      onSelectConversation(newConversationId);

      if (onConversationUpdated) {
        onConversationUpdated();
      }

      return newConversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create a new conversation');
      setShowErrorSnackbar(true);
      setShowNewChatPrompt(true);

      setLocalMessages(prev =>
        prev.map(msg =>
          msg.isPending ? { ...msg, isPending: false } : msg
        )
      );

      setIsLoading(false);
      return null;
    }
  };

  const uploadFilesToServer = async (files: UploadedFile[]): Promise<string[]> => {
    const uploadPromises = files.map(async (uploadedFile) => {
      const formData = new FormData();
      formData.append('file', uploadedFile.file);
      
      try {
        const response = await axios.post(`${CHAT_QNA_URL}/api/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data.file_path || response.data.url || uploadedFile.name;
      } catch (error) {
        console.error(`Error uploading file ${uploadedFile.name}:`, error);
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  };

  const sendMessage = async (messageContent: string, targetConversationId: string) => {
    setIsLoading(true);

    if (streamingEnabled) {
      try {
        const streamingMessageId = `streaming-${Date.now()}`;
        setStreamingMessageId(streamingMessageId);
        
        let fullResponseText = '';
        let responseMetrics: Metrics | null = null;
        let sourcesFromResponse: Array<{ source: string; relevance_score: number; content: string; }> = [];

        let fileUrls: string[] = [];
        if (uploadedFiles.length > 0) {
          try {
            fileUrls = await uploadFilesToServer(uploadedFiles);
          } catch (error) {
            console.error('Error uploading files:', error);
            setErrorMessage('Failed to upload files. Please try again.');
            setShowErrorSnackbar(true);
            setIsLoading(false);
            return;
          }
        }

        setMessages(prev => [...prev, {
          id: streamingMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          isStreaming: true,
          isThinking: true
        }]);

        const requestBody: any = {
          question: messageContent,
          db_name: "lenovo-db",
          stream: true,
          collection_name: currentDepartment.toUpperCase() 
        };

        if (fileUrls.length > 0) {
          requestBody.attachments = fileUrls;
          requestBody.files = uploadedFiles.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size
          }));
        }

        const response = await fetch(`${CHAT_QNA_URL}/api/conversations/${targetConversationId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('ReadableStream not supported');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }
          const chunk = decoder.decode(value, { stream: true });

          const metricsMatch = chunk.match(/__METRICS__(.*?)__METRICS__/);
          if (metricsMatch) {
            try {
              const metricsData = JSON.parse(metricsMatch[1]);
              responseMetrics = metricsData.metrics;
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === streamingMessageId
                    ? { 
                        ...msg, 
                        metrics: responseMetrics,
                      }
                    : msg
                )
              );
              
              fullResponseText += chunk.replace(/__METRICS__(.*?)__METRICS__/, '');
            } catch (e) {
              console.error('Failed to parse metrics:', e);
              fullResponseText += chunk;
            }
          } else {
            fullResponseText += chunk;
          }

          const formattedText = fullResponseText
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n');

          if (formattedText.trim() !== '') {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === streamingMessageId
                  ? { 
                      ...msg, 
                      content: formattedText,
                      isThinking: false
                    }
                  : msg
              )
            );
          } else {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === streamingMessageId
                  ? { ...msg, content: formattedText }
                  : msg
              )
            );
          }
        }

        setMessages(prev =>
          prev.map(msg =>
            msg.id === streamingMessageId
              ? {
                  ...msg,
                  isStreaming: false,
                  isThinking: false,
                  metrics: responseMetrics
                }
              : msg
          )
        );

        axios.get(`${CHAT_QNA_URL}/api/conversations/${targetConversationId}?db_name=lenovo-db`)
          .then(response => {
            if (response.data && response.data.history && response.data.history.length > 0) {
              const latestTurn = response.data.history.filter((turn: { question: string; sources?: any[] }) => 
                turn.question === messageContent
              ).pop();
              
              if (latestTurn && latestTurn.sources) {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === streamingMessageId
                      ? {
                          ...msg,
                          sources: latestTurn.sources
                        }
                      : msg
                  )
                );
              }
            }
          })
          .catch(error => {
            console.error("Error fetching conversation with sources:", error);
          });

        setUploadedFiles([]);
        setIsLoading(false);
        setStreamingMessageId(null);
      } catch (error) {
        console.error("Error in streaming response:", error);
        setErrorMessage(error instanceof Error ? error.message : 'Failed to get streaming response');
        setShowErrorSnackbar(true);
        setIsLoading(false);
        setStreamingMessageId(null);
      }
    }

    if (typeof updateConversationList === 'function') {
      updateConversationList();
    }
  };

  const handleQualityChange = (messageId: string, newQuality: 'good' | 'bad') => {
    const isLocal = localMessages.some(msg => msg.id === messageId);

    if (isLocal) {
      setLocalMessages(prevMessages =>
        prevMessages.map(message =>
          message.id === messageId
            ? { ...message, quality: newQuality }
            : message
        )
      );
    } else {
      setMessages(prevMessages =>
        prevMessages.map(message =>
          message.id === messageId
            ? { ...message, quality: newQuality }
            : message
        )
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | string) => {
    if (typeof e !== 'string' && e?.preventDefault) {
      e.preventDefault();
    }

    const messageContent = typeof e === 'string' ? e : input;
    if ((!messageContent.trim() && uploadedFiles.length === 0) || isLoading) return;

    setShowWelcome(false);
    setErrorMessage(null);

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent.trim(),
      timestamp: new Date().toISOString(),
      isPending: false,
      attachedFiles: [...uploadedFiles]
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (currentConversationId) {
        await sendMessage(messageContent.trim(), currentConversationId);
      } else {
        setShowNewChatPrompt(false);
        const newConversationId = await startNewConversation(messageContent.trim());
        if (newConversationId) {
          setCurrentConversationId(newConversationId);
          await sendMessage(messageContent.trim(), newConversationId);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message');
      setShowErrorSnackbar(true);
      setIsLoading(false);
    }
  };

  const toggleReferences = (messageId: string) => {
    setShowReferences(prev => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const copyToClipboard = (text: string): Promise<void> => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    } else {
      return new Promise((resolve, reject) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (successful) {
            resolve();
          } else {
            reject(new Error('Unable to copy text'));
          }
        } catch (err) {
          document.body.removeChild(textArea);
          reject(err);
        }
      });
    }
  };

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await copyToClipboard(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 1000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const toggleSourcesVisibility = (messageId: string) => {
    setShowReferences(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        position: 'relative',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1100px',
          width: '100%',
          mx: 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            px: { xs: 2, sm: 4 },
            pt: 4,
            pb: 2,
            gap: 1.5,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#1a1a1a',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#E30613',
              borderRadius: '4px',
            },
          }}
        >
          {displayMessages.map((message, index) => (
            <Fade in key={message.id}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 2,
                  opacity: message.isPending ? 0.7 : 1,
                  justifyContent: 'flex-start',
                  mt: index > 0 && message.role === 'user' && displayMessages[index - 1].role === 'assistant' ? 3 : 0,
                  mb: message.role === 'user' ? 0.5 : 0,
                }}
              >
                {message.role === 'user' ? (
                  <AccountCircleIcon
                    sx={{
                      fontSize: 32,
                      color: '#E30613',
                      alignSelf: 'flex-start',
                      mt: 1
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(227, 6, 19, 0.1)',
                      border: '2px solid #E30613',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      alignSelf: 'flex-start',
                      mt: 1
                    }}
                  >
                    <ComputerIcon
                      sx={{
                        fontSize: 20,
                        color: '#E30613',
                      }}
                    />
                  </Box>
                )}

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    width: '100%',
                    alignSelf: 'flex-start',
                  }}
                >
                  {message.role === 'user' ? (
                    <Box sx={{ width: '100%' }}>
                      <Paper
                        elevation={3}
                        sx={{
                          p: 2,
                          maxWidth: '100%',
                          borderRadius: 3,
                          backgroundColor: 'rgba(227, 6, 19, 0.1)',
                          border: '1px solid rgba(227, 6, 19, 0.3)',
                          position: 'relative',
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            color: '#ffffff',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {message.content}
                        </Typography>
                      </Paper>

                      {message.attachedFiles && message.attachedFiles.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {message.attachedFiles.map((file) => (
                            <Chip
                              key={file.id}
                              icon={getFileIcon(file.type)}
                              label={`${file.name} (${formatFileSize(file.size)})`}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(227, 6, 19, 0.1)',
                                border: '1px solid #E30613',
                                color: '#ffffff',
                                '& .MuiChip-label': {
                                  fontSize: '0.75rem',
                                },
                                '& .MuiChip-icon': {
                                  color: '#E30613',
                                },
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        mt: 0.5,
                        width: '100%',
                      }}
                    >
                      <Paper
                        elevation={3}
                        sx={{
                          p: 2,
                          maxWidth: '100%',
                          width: '100%',
                          borderRadius: 3,
                          backgroundColor: '#2d2d2d',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          position: 'relative',
                        }}
                      >
                      <Typography
  variant="body1"
  sx={{
    color: '#ffffff',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    m: 0,
    p: 0,
    '& p': { marginBottom: '0.8em', marginTop: 0 },
    '& p:last-child': { marginBottom: 0 },
  }}
>
  {message.isStreaming ? (
    <>
      {message.content.split('\n').map((paragraph, idx) => (
        paragraph.trim() ? <p key={idx}>{paragraph}</p> : null
      ))}
    </>
  ) : (
    <>
      {message.content.split('\n\n').map((paragraph, idx) => (
        <p key={idx}>{paragraph}</p>
      ))}
    </>
  )}
</Typography>
                        

                        <Box sx={{
                          display: 'flex',
                          mt: 1.5,
                          width: '100%',
                          position: 'relative'
                        }}>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-start' }}>
                            {!message.isStreaming && (
                              <>
                                <Tooltip title={copiedMessageId === message.id ? "Copied!" : "Copy response"}>
                                  <IconButton
                                    onClick={() => handleCopy(message.content, message.id)}
                                    size="small"
                                    sx={{
                                      color: copiedMessageId === message.id ? "#E30613" : "#808080",
                                      '&:hover': {
                                        backgroundColor: 'rgba(227, 6, 19, 0.1)',
                                        color: '#E30613'
                                      }
                                    }}
                                  >
                                    <ContentCopyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Helpful">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleQualityChange(message.id, 'good')}
                                    sx={{
                                      color: message.quality === 'good' ? '#10b981' : '#808080',
                                      '&:hover': {
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10b981'
                                      }
                                    }}
                                  >
                                    <ThumbUpIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Not helpful">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleQualityChange(message.id, 'bad')}
                                    sx={{
                                      color: message.quality === 'bad' ? '#ef4444' : '#808080',
                                      '&:hover': {
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444'
                                      }
                                    }}
                                  >
                                    <ThumbDownIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                {message.sources && message.sources.length > 0 && (
                                  <Tooltip title="View sources">
                                    <IconButton
                                      size="small"
                                      onClick={() => toggleReferences(message.id)}
                                      sx={{
                                        color: '#808080',
                                        '&:hover': {
                                          backgroundColor: 'rgba(227, 6, 19, 0.1)',
                                          color: '#E30613'
                                        }
                                      }}
                                    >
                                      <DescriptionIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </>
                            )}
                          </Box>

                          {message.metrics && (
                            <Box sx={{
                              position: 'absolute',
                              right: 0,
                              bottom: 0,
                              transition: 'opacity 0.3s ease-in-out'
                            }}>
                              <Tooltip
                                title={
                                  <Box sx={{ p: 1 }}>
                                    <Typography variant="caption" display="block">
                                      Time to First Token: {message.metrics.ttft.toFixed(3)}s
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                      Throughput: {message.metrics.throughput.toFixed(3)} t/s
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                      Output tokens: {message.metrics.output_tokens}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                      End-to-End Latency: {message.metrics.e2e_latency.toFixed(3)}s
                                    </Typography>
                                  </Box>
                                }
                              >
                                <IconButton size="small" sx={{ color: '#808080' }}>
                                  <InfoOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </Box>

                      </Paper>
                    </Box>
                  )}

                  {message.role === 'assistant' && message.sources && (
                    <Collapse in={showReferences[message.id]} sx={{ mt: 1, maxWidth: '100%' }}>
                      <Box
                        sx={{
                          backgroundColor: '#1a1a1a',
                          borderRadius: 2,
                          p: 2,
                          border: '1px solid rgba(227, 6, 19, 0.3)',
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#E30613', fontWeight: 600 }}>
                          Sources
                        </Typography>
                        {message.sources?.map((source, index) => (
                          <Box key={index} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                color: '#E30613',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                mb: 0.5
                              }}
                            >
                              {source.source} (Score: {source.relevance_score.toFixed(2)})
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#b0b0b0',
                                fontSize: '0.8rem',
                                lineHeight: 1.4
                              }}
                            >
                              {source.content}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Collapse>
                  )}
                </Box>
              </Box>
            </Fade>
          ))}

          {showWelcome && (
            <Fade in timeout={1000}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "80vh",
                  textAlign: "center",
                  px: 3,
                }}
              >
                <Box
                  sx={{
                    maxWidth: 700,
                    width: "100%",
                    backgroundColor: "#2d2d2d",
                    borderRadius: 4,
                    p: 5,
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                    border: "1px solid rgba(227, 6, 19, 0.3)",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      background: "linear-gradient(90deg, #E30613, #ff1a2e)",
                      borderRadius: "4px 4px 0 0",
                    },
                  }}
                >
                  <Box sx={{ mb: 5 }}>
                    <Box sx={{ mb: 3 }}>
                      <svg width="120" height="30" viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <text x="0" y="24" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="700" fill="#E30613" letterSpacing="-0.5">
                          Lenovo
                        </text>
                      </svg>
                    </Box>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        mb: 2, 
                        color: '#ffffff',
                        fontWeight: "800",
                        fontSize: { xs: "2rem", md: "2.5rem" },
                        letterSpacing: "-0.02em",
                      }}
                    >
                      Ask Your Questions
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: "#b0b0b0", 
                        fontWeight: "400",
                        fontSize: "1.1rem",
                        maxWidth: 500,
                        mx: "auto",
                        lineHeight: 1.6,
                      }}
                    >
                      Get instant, intelligent answers from your AI-powered server documentation assistant
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 4 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: "#808080", 
                        fontSize: "1rem",
                        fontWeight: "500",
                      }}
                    >
                      Start a conversation by typing your question below or upload files to analyze
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Fade>
          )}

          {isLoading && !streamingEnabled && !streamingMessageId && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} sx={{ color: '#E30613' }} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {uploadedFiles.length > 0 && (
          <Box
            sx={{
              backgroundColor: '#2d2d2d',
              borderTop: '1px solid rgba(227, 6, 19, 0.3)',
              px: { xs: 2, sm: 4 },
              py: 2,
              maxWidth: '1100px',
              mx: 'auto',
              width: '100%',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#b0b0b0' }}>
              Attached files ({uploadedFiles.length}):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {uploadedFiles.map((file) => (
                <Chip
                  key={file.id}
                  icon={getFileIcon(file.type)}
                  label={`${file.name} (${formatFileSize(file.size)})`}
                  onDelete={() => removeFile(file.id)}
                  deleteIcon={<CloseIcon />}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(227, 6, 19, 0.1)',
                    border: '1px solid #E30613',
                    color: '#ffffff',
                    '& .MuiChip-label': {
                      fontSize: '0.75rem',
                    },
                    '& .MuiChip-icon': {
                      color: '#E30613',
                    },
                    '& .MuiChip-deleteIcon': {
                      color: '#E30613',
                      '&:hover': {
                        color: '#ff1a2e',
                      },
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Box
          sx={{
            backgroundColor: '#2d2d2d',
            borderTop: '2px solid #E30613',
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.3)',
            px: { xs: 2, sm: 4 },
            py: { xs: 2, sm: 3 },
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              maxWidth: '1100px',
              width: '100%',
              mx: 'auto',
              display: 'flex',
              gap: 1.5,
              alignItems: 'flex-end',
            }}
          >
            <Box sx={{ flexGrow: 1, position: 'relative' }}>
              <TextField
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLoading ? "Please wait..." : "Type your message..."}
                variant="outlined"
                fullWidth
                multiline
                maxRows={4}
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.2s ease',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(227, 6, 19, 0.5)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '2px solid #E30613',
                      boxShadow: '0 0 0 3px rgba(227, 6, 19, 0.2)',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      color: '#808080',
                    },
                  },
                  '& .MuiInputBase-input': {
                    py: 1.5,
                    px: 2,
                    fontSize: '0.95rem',
                    lineHeight: 1.4,
                    '&::placeholder': {
                      color: '#808080',
                      opacity: 1,
                    },
                  },
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pb: 0.5 }}>
              <Tooltip title="Attach files" arrow>
                <Box>
                  <IconButton
                    onClick={handleUploadMenuOpen}
                    disabled={isLoading || isUploading}
                    sx={{
                      width: 44,
                      height: 44,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#b0b0b0',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(227, 6, 19, 0.1)',
                        borderColor: '#E30613',
                        color: '#E30613',
                      },
                      '&.Mui-disabled': {
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        color: '#5a5a5a',
                      },
                    }}
                  >
                    {isUploading ? (
                      <CircularProgress size={20} sx={{ color: '#E30613' }} />
                    ) : (
                      <AddIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>
              </Tooltip>

              <Menu
                anchorEl={uploadMenuAnchor}
                open={Boolean(uploadMenuAnchor)}
                onClose={handleUploadMenuClose}
                sx={{
                  '& .MuiPaper-root': {
                    borderRadius: 2,
                    minWidth: 200,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                    backgroundColor: '#2d2d2d',
                    border: '1px solid rgba(227, 6, 19, 0.3)',
                  },
                  '& .MuiMenuItem-root': {
                    color: '#ffffff',
                    '&:hover': {
                      backgroundColor: 'rgba(227, 6, 19, 0.1)',
                    },
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#E30613',
                  },
                }}
              >
                <MenuItem onClick={() => triggerFileInput()}>
                  <ListItemIcon>
                    <AttachFileIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Upload Document</ListItemText>
                </MenuItem>
              </Menu>

              <Tooltip title="Send message" arrow>
                <Box>
                  <IconButton
                    type="submit"
                    disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                    sx={{
                      width: 44,
                      height: 44,
                      backgroundColor: '#E30613',
                      color: 'white',
                      boxShadow: '0 2px 8px rgba(227, 6, 19, 0.5)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#c9050f',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(227, 6, 19, 0.6)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                      '&.Mui-disabled': {
                        backgroundColor: '#5a5a5a',
                        color: '#808080',
                        boxShadow: 'none',
                        transform: 'none',
                      },
                    }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}