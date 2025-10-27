import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItemButton,
  IconButton,
  Paper,
  Tooltip,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChatIcon from '@mui/icons-material/Chat';
import { CHAT_QNA_URL } from '@/lib/constants';

interface Conversation {
  conversation_id: string;
  created_at: string;
  last_updated: string;
  context?: string;
  history: Array<{
    question: { content: string; timestamp: string };
    answer: { content: string; timestamp: string };
  }> | Array<any>;
}

interface LeftSidebarProps {
  onSelectConversation: (id: string) => void;
  selectedConversation: string | null;
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  refreshTrigger?: number;
}

export default function LeftSidebar({
  onSelectConversation,
  selectedConversation,
  isCollapsed,
  onCollapseChange,
  refreshTrigger = 0
}: LeftSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [deletePreview, setDeletePreview] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [selectedConversation, refreshTrigger]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${CHAT_QNA_URL}/api/conversations?db_name=lenovo-db`);
      const data = await response.data;
      console.log('Fetched conversations:', data);
      setConversations(data.conversations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
      console.error('Error fetching conversations:', err);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const conversation = conversations.find(conv => conv.conversation_id === id);
    if (conversation) {
      const preview = getConversationPreview(conversation);
      setDeletePreview(preview.question);
    }
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
    setDeletePreview('');
  };

  const confirmDelete = async () => {
    if (!conversationToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${CHAT_QNA_URL}/api/conversations/${conversationToDelete}?db_name=lenovo-db`);
      setConversations(prevConversations =>
        prevConversations.filter(conv => conv.conversation_id !== conversationToDelete)
      );
      if (selectedConversation === conversationToDelete) {
        onSelectConversation('');
      }
      closeDeleteDialog();
    } catch (err) {
      console.error('Error deleting conversation:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getConversationPreview = (conversation: Conversation) => {
    if (!conversation.history || !Array.isArray(conversation.history) || conversation.history.length === 0) {
      return { context: 'General', question: 'Empty conversation' };
    }
    const lastTurn = conversation.history[conversation.history.length - 1];
    const questionContent = lastTurn.question?.content ||
      (typeof lastTurn.question === 'string' ? lastTurn.question : '') ||
      'Empty question';
    return { context: conversation.context || 'General', question: questionContent };
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const renderEmptyState = () => (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      p: 3,
      textAlign: 'center',
      gap: 2
    }}>
      <ChatIcon sx={{ fontSize: 48, color: '#808080', opacity: 0.6 }} />
      <Typography variant="body1" sx={{ color: '#b0b0b0' }}>
        No conversation history found
      </Typography>
      <Typography variant="body2" sx={{ color: '#808080', mb: 2 }}>
        Start a new chat to begin
      </Typography>
    </Box>
  );

  const hasConversations = conversations.length > 0;

  return (
    <>
      <Paper
        elevation={3}
        sx={{
          width: isCollapsed ? 60 : 300,
          transition: 'width 0.3s ease-in-out',
          backgroundColor: '#2d2d2d',
          height: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: '64px',
          overflow: 'hidden',
          borderRadius: 0,
          borderRight: '1px solid rgba(227, 6, 19, 0.3)',
          zIndex: 1200,
        }}
      >
        <IconButton
          onClick={() => onCollapseChange(!isCollapsed)}
          sx={{
            position: 'absolute',
            right: -1,
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#2d2d2d',
            border: '1px solid rgba(227, 6, 19, 0.3)',
            borderLeft: 'none',
            borderRadius: '0 8px 8px 0',
            color: '#E30613',
            '&:hover': {
              backgroundColor: '#1a1a1a',
              color: '#ff1a2e',
            },
            zIndex: 10,
            width: '20px',
            height: '40px',
          }}
        >
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>

        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          opacity: isCollapsed ? 0 : 1,
          transition: 'opacity 0.2s',
          visibility: isCollapsed ? 'hidden' : 'visible',
        }}>
          {hasConversations && (
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(227, 6, 19, 0.3)' }}>
              <Tooltip title="Start a new chat" arrow>
                <IconButton
                  onClick={() => onSelectConversation('')}
                  sx={{
                    backgroundColor: '#E30613',
                    color: 'white',
                    width: '100%',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    py: 1,
                    '&:hover': {
                      backgroundColor: '#c9050f',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(227, 6, 19, 0.4)',
                    },
                  }}
                >
                  <AddIcon /> <Typography sx={{ ml: 1, fontWeight: 600 }}>New Chat</Typography>
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: '#E30613' }} />
            </Box>
          ) : error ? (
            <Box sx={{ p: 2 }}>
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ff6b6b',
                  '& .MuiAlert-icon': {
                    color: '#ff6b6b'
                  },
                  '& .MuiAlert-message': { width: '100%' }
                }}
              >
                {error}
              </Alert>
              <Button
                variant="outlined"
                onClick={fetchConversations}
                sx={{
                  mb: 2,
                  mx: 'auto',
                  display: 'block',
                  borderColor: '#E30613',
                  color: '#E30613',
                  '&:hover': {
                    borderColor: '#ff1a2e',
                    backgroundColor: 'rgba(227, 6, 19, 0.1)'
                  }
                }}
              >
                Try Again
              </Button>
              {renderEmptyState()}
            </Box>
          ) : conversations.length === 0 ? (
            renderEmptyState()
          ) : (
            <List sx={{
              overflow: 'auto',
              flexGrow: 1,
              pt: 2,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#1a1a1a',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#E30613',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#ff1a2e',
              },
            }}>
              {conversations.map((conversation) => {
                const preview = getConversationPreview(conversation);

                return (
                  <ListItemButton
                    key={conversation.conversation_id}
                    selected={selectedConversation === conversation.conversation_id}
                    onClick={() => onSelectConversation(conversation.conversation_id)}
                    sx={{
                      borderRadius: '8px',
                      mx: 1,
                      mb: 1,
                      p: 1.5,
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'rgba(227, 6, 19, 0.1)',
                        transform: 'translateX(4px)',
                        boxShadow: '0 4px 12px rgba(227, 6, 19, 0.2)',
                        borderColor: '#E30613',
                      },
                      minHeight: '60px',
                      maxHeight: '80px',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(227, 6, 19, 0.15)',
                        borderColor: '#E30613',
                        '&:hover': {
                          background: 'rgba(227, 6, 19, 0.2)',
                        }
                      },
                      '& .MuiTypography-root': {
                        transition: 'color 0.2s ease',
                      },
                    }}
                  >
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      gap: 1,
                      mb: 0.5
                    }}>
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          color: '#808080',
                          flexShrink: 0,
                        }}
                      >
                        {formatDate(conversation.created_at)}
                      </Typography>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: '12px',
                          px: 1,
                          py: 0.25,
                          flexShrink: 0,
                          backgroundColor: 'rgba(227, 6, 19, 0.2)',
                          border: '1px solid rgba(227, 6, 19, 0.5)',
                        }}
                      >
                        <Typography sx={{
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          letterSpacing: '0.02em',
                          color: '#E30613',
                        }}>
                          {preview.context}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={(e) => openDeleteDialog(conversation.conversation_id, e)}
                        size="small"
                        sx={{
                          ml: 'auto',
                          opacity: 0,
                          padding: 0.5,
                          transition: 'opacity 0.2s',
                          flexShrink: 0,
                          color: '#ff6b6b',
                          '&:hover': {
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          },
                          '.MuiListItemButton-root:hover &': {
                            opacity: 1,
                          }
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                      </IconButton>
                    </Box>

                    <Typography
                      sx={{
                        fontSize: '0.85rem',
                        color: '#ffffff',
                        width: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.2,
                      }}
                    >
                      {preview.question}
                    </Typography>
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>

        {isCollapsed && (
          <Box sx={{
            position: 'absolute',
            top: '64px',
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pt: 2,
            gap: 2
          }}>
            <Tooltip title="Start a new chat" arrow placement="right">
              <IconButton
                onClick={() => {
                  onCollapseChange(false);
                  onSelectConversation('');
                }}
                sx={{
                  backgroundColor: '#E30613',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#c9050f',
                  },
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={!isDeleting ? closeDeleteDialog : undefined}
        PaperProps={{
          sx: { bgcolor: '#2d2d2d', color: '#ffffff' }
        }}
      >
        <DialogTitle 
          sx={{ 
            color: '#E30613', 
            fontWeight: 600,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          Delete Conversation?
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: '#b0b0b0' }}>
            Are you sure you want to delete this conversation? This action cannot be undone.
            {deletePreview && (
              <Box sx={{ 
                mt: 2, 
                p: 1.5, 
                bgcolor: 'rgba(227, 6, 19, 0.1)', 
                borderRadius: 1,
                border: '1px solid rgba(227, 6, 19, 0.3)'
              }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontStyle: 'italic',
                    color: '#ffffff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  "{deletePreview}"
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
          <Button
            onClick={closeDeleteDialog}
            disabled={isDeleting}
            sx={{
              color: '#b0b0b0',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <DeleteIcon />}
            sx={{
              backgroundColor: '#E30613',
              '&:hover': {
                backgroundColor: '#c9050f'
              }
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}