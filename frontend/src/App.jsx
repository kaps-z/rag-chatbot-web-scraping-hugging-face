import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  Divider,
  CircularProgress,
  AppBar,
  Toolbar,
  CssBaseline,
} from '@mui/material';
import {
  Chat as ChatIcon,
  CloudUpload as UploadIcon,
  Storage as StorageIcon,
  Send as SendIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';

const drawerWidth = 240;

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [websites, setWebsites] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [ingestStatus, setIngestStatus] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatting, setIsChatting] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('');

  useEffect(() => {
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      const response = await axios.get('/api/websites');
      setWebsites(response.data.websites || []);
    } catch (error) {
      console.error("Error fetching websites:", error);
    }
  };

  const handleIngest = async (e) => {
    e.preventDefault();
    if (!urlInput || !collectionName) return;

    setIsIngesting(true);
    setIngestStatus('Starting ingestion...');

    try {
      const response = await axios.post('/api/ingest', {
        url: urlInput,
        collection_name: collectionName
      });
      setIngestStatus(`Success! Added ${response.data.chunks} chunks.`);
      fetchWebsites();
      setUrlInput('');
      setCollectionName('');
    } catch (error) {
      setIngestStatus(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatMessage) return;

    const userMsg = { role: 'user', content: chatMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    setIsChatting(true);

    try {
      const response = await axios.post('/api/chat', {
        message: userMsg.content,
        collection_name: selectedCollection || null
      });

      const botMsg = { role: 'assistant', content: response.data.reply };
      setChatHistory(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg = { role: 'assistant', content: "Error: Could not get response." };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Sidebar */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar>
           <StorageIcon sx={{ mr: 1, color: 'primary.main' }} />
           <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
             WebScrapperAI
           </Typography>
        </Toolbar>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton
              selected={activeTab === 'chat'}
              onClick={() => setActiveTab('chat')}
            >
              <ListItemIcon>
                <ChatIcon color={activeTab === 'chat' ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Chat" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              selected={activeTab === 'ingest'}
              onClick={() => setActiveTab('ingest')}
            >
              <ListItemIcon>
                <UploadIcon color={activeTab === 'ingest' ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Ingest Data" />
            </ListItemButton>
          </ListItem>
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
            MY COLLECTIONS
          </Typography>
          {websites.length === 0 ? (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              No collections yet.
            </Typography>
          ) : (
            <List dense>
              {websites.map((site) => (
                <ListItem key={site} disablePadding>
                  <ListItemButton
                    selected={selectedCollection === site}
                    onClick={() => {
                        setSelectedCollection(site === selectedCollection ? '' : site);
                        setActiveTab('chat');
                    }}
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemText primary={`# ${site}`} primaryTypographyProps={{ noWrap: true }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{ flexGrow: 1, bgcolor: 'background.default', height: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        
        {activeTab === 'ingest' && (
          <Box sx={{ p: 4, maxWidth: 800, mx: 'auto', width: '100%', mt: 4 }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Add New Knowledge
            </Typography>
            <Paper elevation={1} sx={{ p: 4, mt: 2 }}>
              <form onSubmit={handleIngest}>
                <Box sx={{ mb: 3 }}>
                   <TextField
                     fullWidth
                     label="Target URL"
                     variant="outlined"
                     value={urlInput}
                     onChange={(e) => setUrlInput(e.target.value)}
                     placeholder="https://example.com"
                     required
                     margin="normal"
                   />
                </Box>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Collection Name"
                    variant="outlined"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="e.g., react-docs"
                    required
                    helperText="Short name to identify this knowledge base."
                    margin="normal"
                  />
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isIngesting}
                  startIcon={isIngesting ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
                  fullWidth
                >
                  {isIngesting ? 'Ingesting...' : 'Start Ingestion'}
                </Button>
              </form>
              
              {ingestStatus && (
                <Paper
                  variant="outlined"
                  sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: ingestStatus.startsWith('Error') ? 'error.light' : 'success.light',
                    color: ingestStatus.startsWith('Error') ? 'error.contrastText' : 'success.contrastText',
                    borderColor: ingestStatus.startsWith('Error') ? 'error.main' : 'success.main',
                  }}
                >
                  <Typography variant="body2">{ingestStatus}</Typography>
                </Paper>
              )}
            </Paper>
          </Box>
        )}

        {activeTab === 'chat' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <AppBar position="static" color="inherit" elevation={1}>
              <Toolbar>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {selectedCollection ? `Chatting with: ${selectedCollection}` : 'Chat with General AI'}
                </Typography>
                {selectedCollection && (
                  <Button
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() => setSelectedCollection('')}
                  >
                    Clear Context
                  </Button>
                )}
              </Toolbar>
            </AppBar>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {chatHistory.length === 0 && (
                <Box sx={{ textAlign: 'center', mt: 10, opacity: 0.5 }}>
                  <ChatIcon sx={{ fontSize: 60, mb: 2, color: 'action.disabled' }} />
                  <Typography variant="h6" color="text.secondary">Start a conversation...</Typography>
                </Box>
              )}
              {chatHistory.map((msg, idx) => (
                <Box
                  key={idx}
                  sx={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                      color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                      borderRadius: 2,
                      borderBottomRightRadius: msg.role === 'user' ? 0 : 2,
                      borderBottomLeftRadius: msg.role !== 'user' ? 0 : 2,
                    }}
                  >
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </Typography>
                  </Paper>
                </Box>
              ))}
              {isChatting && (
                <Box sx={{ alignSelf: 'flex-start' }}>
                  <Paper
                     elevation={1}
                     sx={{ p: 2, borderRadius: 2, borderBottomLeftRadius: 0 }}
                  >
                    <CircularProgress size={20} />
                  </Paper>
                </Box>
              )}
            </Box>

            <Paper elevation={3} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <form onSubmit={handleChat} style={{ display: 'flex', gap: '10px' }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  disabled={isChatting}
                  size="small"
                />
                <IconButton
                  type="submit"
                  color="primary"
                  disabled={isChatting || !chatMessage.trim()}
                  sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.main' } }}
                >
                  <SendIcon />
                </IconButton>
              </form>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default App;