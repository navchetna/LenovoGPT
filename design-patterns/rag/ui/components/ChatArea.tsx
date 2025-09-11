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
import { CHAT_QNA_URL } from '@/lib/constants';
import AudioRecorder from './AudioRecorder';

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
}

export default function ChatArea({
  conversationId,
  onSelectConversation,
  onConversationUpdated,
  updateConversationList
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

      const response = await axios.get(`${CHAT_QNA_URL}/api/conversations/${id}?db_name=rag_db`);
      const data = response.data;
      console.log('Loaded conversation data:', data);

      if (!data.history || !Array.isArray(data.history) || data.history.length === 0) {
        console.warn('History is missing, empty, or not an array in conversation data', data);
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

      console.log('Formatted messages:', formattedMessages);

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

      // Create preview for images
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
    
    // Clear the input
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
        db_name: 'rag_db'
      });

      const data = await response.data;
      console.log('Created new conversation:', data);

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
        // Replace with your actual file upload endpoint
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

        // Upload files if any
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
          db_name: "rag_db",
          stream: true
        };

        // Include file information in the request if files were uploaded
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

        axios.get(`${CHAT_QNA_URL}/api/conversations/${targetConversationId}?db_name=rag_db`)
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

        // Clear uploaded files after successful send
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

  const handleTranscription = (text: string) => {
    if (text.trim()) {
      setInput(prev => {
        if (prev.trim()) {
          return `${prev.trim()} ${text.trim()}`;
        }
        return text.trim();
      });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        position: 'relative',
        backgroundColor: '#f5f5f5',
      }}
    >
      {/* Hidden file input */}
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
                      color: '#0071C5',
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
                      backgroundColor: 'rgb(245,245,245)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      alignSelf: 'flex-start',
                      mt: 1
                    }}
                  >
                    <AutoAwesomeIcon
                      sx={{
                        fontSize: 24,
                        color: '#0071C5',
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
                          borderRadius: 4,
                          backgroundColor: '#e3f2fd',
                          position: 'relative',
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            color: '#333',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {message.content}
                        </Typography>
                      </Paper>

                      {/* Display attached files */}
                      {message.attachedFiles && message.attachedFiles.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {message.attachedFiles.map((file) => (
                            <Chip
                              key={file.id}
                              icon={getFileIcon(file.type)}
                              label={`${file.name} (${formatFileSize(file.size)})`}
                              size="small"
                              sx={{
                                backgroundColor: '#e3f2fd',
                                border: '1px solid #1976d2',
                                '& .MuiChip-label': {
                                  fontSize: '0.75rem',
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
                          borderRadius: 4,
                          backgroundColor: '#fff',
                          position: 'relative',
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            color: '#333',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            mt: 0,
                            mb: 0,
                          }}
                        >
                          {message.isThinking ? (
                            <Typography
                              variant="body1"
                              sx={{
                                color: '#333',
                                lineHeight: 1.5,
                                whiteSpace: 'pre-wrap',
                                display: 'flex',
                                alignItems: 'center',
                                m: 0,
                                p: 0,
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box
                                  sx={{
                                    display: 'inline-flex',
                                    gap: '3px',
                                    position: 'relative',
                                    top: '2px',
                                  }}
                                >
                                  {[0, 1, 2].map((i) => (
                                    <Box
                                      key={i}
                                      component="span"
                                      sx={{
                                        width: '3px',
                                        height: '3px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(25, 118, 210, 0.6)',
                                        animation: `thinkingDot 1.2s infinite ease-in-out ${i * 0.15}s`,
                                        '@keyframes thinkingDot': {
                                          '0%, 100%': {
                                            transform: 'translateY(0)',
                                            opacity: 0.5,
                                          },
                                          '50%': {
                                            transform: 'translateY(-2px)',
                                            opacity: 0.9,
                                          },
                                        },
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Box>
                            </Typography>
                          ) : (
                            <Typography
                              variant="body1"
                              sx={{
                                color: '#333',
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
                                    color={copiedMessageId === message.id ? "primary" : "default"}
                                  >
                                    <ContentCopyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Helpful">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleQualityChange(message.id, 'good')}
                                    color={message.quality === 'good' ? 'primary' : 'default'}
                                  >
                                    <ThumbUpIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Not helpful">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleQualityChange(message.id, 'bad')}
                                    color={message.quality === 'bad' ? 'error' : 'default'}
                                  >
                                    <ThumbDownIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                {message.sources && message.sources.length > 0 && (
                                  <Tooltip title="View sources">
                                    <IconButton
                                      size="small"
                                      onClick={() => toggleReferences(message.id)}
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
                                <IconButton size="small">
                                  <InfoOutlinedIcon 
                                    fontSize="small" 
                                    sx={{ mt: 1, color: 'text.secondary' }} 
                                  />
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
                          backgroundColor: '#f8f9fa',
                          borderRadius: 2,
                          p: 2,
                          border: '1px solid #e0e0e0',
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ mb: 1, color: '#2c2c2c' }}>
                          Sources
                        </Typography>
                        {message.sources?.map((source, index) => (
                          <Box key={index} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                color: '#1976d2',
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
                                color: '#666',
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
                  backgroundColor: "#f5f5f5",
                }}
              >
                <Box
                  sx={{
                    maxWidth: 700,
                    width: "100%",
                    backgroundColor: "#fff",
                    borderRadius: 4,
                    p: 5,
                    boxShadow: "0 8px 32px rgba(59, 130, 246, 0.12)",
                    border: "1px solid rgba(59, 130, 246, 0.08)",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4)",
                      borderRadius: "4px 4px 0 0",
                    },
                  }}
                >
                  {/* Header Section */}
                  <Box sx={{ mb: 5 }}>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        mb: 2, 
                        background: "linear-gradient(135deg, #3b82f6, #0d47a1)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
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
                        color: "#0d47a1", 
                        fontWeight: "400",
                        fontSize: "1.1rem",
                        maxWidth: 500,
                        mx: "auto",
                        lineHeight: 1.6,
                      }}
                    >
                      Get instant, intelligent answers from your AI-powered enterprise assistant
                    </Typography>
                  </Box>

                  {/* Call to Action */}
                  <Box sx={{ mt: 4 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: "#64748b", 
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
              <CircularProgress size={24} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* File Upload Area */}
        {uploadedFiles.length > 0 && (
          <Box
            sx={{
              backgroundColor: '#fff',
              borderTop: '1px solid #e5e7eb',
              px: { xs: 2, sm: 4 },
              py: 2,
              maxWidth: '1100px',
              mx: 'auto',
              width: '100%',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
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
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #0ea5e9',
                    '& .MuiChip-label': {
                      fontSize: '0.75rem',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Input Area */}
        <Box
          sx={{
            backgroundColor: '#fff',
            borderTop: '2px solid #e5e7eb',
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.04)',
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
                    backgroundColor: '#fafafa',
                    border: '1px solid #e0e0e0',
                    transition: 'all 0.2s ease',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                      border: '1px solid #d0d0d0',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#fff',
                      border: '2px solid #1976d2',
                      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: '#f0f0f0',
                      color: '#999',
                    },
                  },
                  '& .MuiInputBase-input': {
                    py: 1.5,
                    px: 2,
                    fontSize: '0.95rem',
                    lineHeight: 1.4,
                  },
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pb: 0.5 }}>
              {/* File Upload Button */}
              <Tooltip title="Attach files" arrow>
                <Box>
                  <IconButton
                    onClick={handleUploadMenuOpen}
                    disabled={isLoading || isUploading}
                    sx={{
                      width: 44,
                      height: 44,
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e0e0e0',
                      color: '#666',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#e3f2fd',
                        borderColor: '#1976d2',
                        color: '#1976d2',
                      },
                      '&.Mui-disabled': {
                        backgroundColor: 'rgba(0, 0, 0, 0.06)',
                        color: 'rgba(0, 0, 0, 0.26)',
                      },
                    }}
                  >
                    {isUploading ? (
                      <CircularProgress size={20} />
                    ) : (
                      <AddIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>
              </Tooltip>

              {/* File Upload Menu */}
              <Menu
                anchorEl={uploadMenuAnchor}
                open={Boolean(uploadMenuAnchor)}
                onClose={handleUploadMenuClose}
                sx={{
                  '& .MuiPaper-root': {
                    borderRadius: 2,
                    minWidth: 200,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
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
                      backgroundColor: '#1976d2',
                      color: 'white',
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#1565c0',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                      '&.Mui-disabled': {
                        backgroundColor: 'rgba(0, 0, 0, 0.12)',
                        color: 'rgba(0, 0, 0, 0.26)',
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
}// VOLUME MOUNT TEST - Sat Sep  6 21:53:54 IST 2025